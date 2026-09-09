const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Wallet, Transaction, WithdrawalRequest, BankAccount, Invoice, User, sequelize } = require('../models');
const wallet = require('../services/walletService');
const pg = require('../services/paymentGateway');
const mailer = require('../services/mailer');
const invoiceSvc = require('../services/invoiceService');

exports.getMyWallet = asyncHandler(async (req, res) => {
  const w = await wallet.getOrCreate(req.user.id);
  res.json({ success: true, data: w });
});

exports.listTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, from, to } = req.query;
  const where = { userId: req.user.id };
  if (type) where.type = type;
  if (from || to) where.createdAt = { ...(from && { [Op.gte]: new Date(from) }), ...(to && { [Op.lte]: new Date(to) }) };
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    offset: (page - 1) * limit,
    limit: +limit,
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
});

exports.depositIntent = asyncHandler(async (req, res) => {
  const { amount, method = 'sslcommerz', returnUrl } = req.body;
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const intent = await pg.createDepositIntent({
    userId: req.user.id,
    amount,
    method,
    returnUrl: returnUrl || `${req.protocol}://${req.get('host')}/buyer/wallet`,
  });
  const txn = await Transaction.create({
    userId: req.user.id,
    type: 'deposit',
    amount,
    method,
    status: 'pending',
    gatewayTransactionId: intent.gatewayTransactionId,
  });
  res.status(201).json({ success: true, data: { intent, transaction: txn } });
});

// Confirms a deposit (gateway webhook would call this — exposing manual confirm for dev)
exports.confirmDeposit = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  await sequelize.transaction(async (t) => {
    const txn = await Transaction.findByPk(transactionId, { transaction: t });
    if (!txn) throw ApiError.notFound('Transaction not found');
    if (txn.status === 'completed') return;
    if (txn.userId !== req.user.id && req.user.role !== 'admin') throw ApiError.forbidden();

    await wallet.credit(
      {
        userId: txn.userId,
        amount: txn.amount,
        type: 'deposit',
        method: txn.method,
        reference: txn.reference,
        notes: 'Deposit confirmed',
      },
      t,
    );
    txn.status = 'completed';
    await txn.save({ transaction: t });
  });
  res.json({ success: true });
});

exports.requestRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount <= 0) throw ApiError.badRequest('Invalid amount');
  const txn = await Transaction.create({
    userId: req.user.id,
    type: 'refund',
    amount,
    status: 'pending',
    notes: reason,
    method: 'manual',
  });
  res.status(201).json({ success: true, data: txn });
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, requestedMethod, paymentAddress, bankAccountId } = req.body;
  const w = await wallet.getOrCreate(req.user.id);
  if (Number(amount) > Number(w.availableBalance)) throw ApiError.badRequest('Insufficient balance');

  return sequelize.transaction(async (t) => {
    w.availableBalance = Number(w.availableBalance) - Number(amount);
    w.pendingBalance = Number(w.pendingBalance) + Number(amount);
    await w.save({ transaction: t });

    const wr = await WithdrawalRequest.create(
      {
        userId: req.user.id,
        amount,
        requestedMethod,
        paymentAddress,
        bankAccountId,
        status: 'pending',
      },
      { transaction: t },
    );
    res.status(201).json({ success: true, data: wr });
  });
});

exports.listMyWithdrawals = asyncHandler(async (req, res) => {
  const rows = await WithdrawalRequest.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});

// Admin: list all withdrawal requests
exports.adminListWithdrawals = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (from || to) where.createdAt = { ...(from && { [Op.gte]: new Date(from) }), ...(to && { [Op.lte]: new Date(to) }) };
  const rows = await WithdrawalRequest.findAll({
    where,
    include: [{ model: User, attributes: ['id', 'publicId', 'email', 'firstName', 'lastName'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});

exports.adminProcessWithdrawal = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body; // approve | reject | complete
  await sequelize.transaction(async (t) => {
    const wr = await WithdrawalRequest.findByPk(req.params.id, { transaction: t });
    if (!wr) throw ApiError.notFound();

    const user = await User.findByPk(wr.userId, { transaction: t });
    const userWallet = await wallet.getOrCreate(wr.userId, t);

    if (action === 'reject') {
      userWallet.availableBalance = Number(userWallet.availableBalance) + Number(wr.amount);
      userWallet.pendingBalance = Math.max(0, Number(userWallet.pendingBalance) - Number(wr.amount));
      await userWallet.save({ transaction: t });
      wr.status = 'rejected';
    } else if (action === 'approve') {
      wr.status = 'approved';
    } else if (action === 'complete') {
      const gw = await pg.processWithdrawal({
        userId: wr.userId,
        amount: wr.amount,
        method: wr.requestedMethod,
        paymentAddress: wr.paymentAddress,
      });
      userWallet.pendingBalance = Math.max(0, Number(userWallet.pendingBalance) - Number(wr.amount));
      await userWallet.save({ transaction: t });
      await Transaction.create(
        {
          userId: wr.userId,
          type: 'withdrawal',
          amount: wr.amount,
          method: wr.requestedMethod,
          status: 'completed',
          gatewayTransactionId: gw.gatewayTransactionId,
          notes: adminNote,
        },
        { transaction: t },
      );
      wr.status = 'completed';
      wr.processedAt = new Date();

      let bankLast5 = null;
      if (wr.bankAccountId) {
        const ba = await BankAccount.findByPk(wr.bankAccountId, { transaction: t });
        if (ba?.accountNumber) bankLast5 = ba.accountNumber.slice(-5);
      }
      const tpl = mailer.templates.withdrawalApproved({
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        amount: wr.amount,
        method: wr.requestedMethod,
        bankLast5,
      });
      mailer.send({ to: user.email, ...tpl }).catch(() => {});
    } else {
      throw ApiError.badRequest('Invalid action');
    }
    if (adminNote) wr.adminNote = adminNote;
    await wr.save({ transaction: t });
    res.json({ success: true, data: wr });
  });
});

// Admin: process buyer refund manually
exports.adminProcessRefund = asyncHandler(async (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount) throw ApiError.badRequest('userId and amount required');
  await sequelize.transaction(async (t) => {
    await wallet.credit(
      {
        userId,
        amount,
        type: 'refund',
        notes: reason || 'Admin-issued refund',
      },
      t,
    );
  });
  const user = await User.findByPk(userId);
  const tpl = mailer.templates.refundProcessed({
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    amount,
    reason,
  });
  mailer.send({ to: user.email, ...tpl }).catch(() => {});
  res.json({ success: true });
});

// Admin: full ledger
exports.adminListTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, userId, type, status, from, to, transactionId } = req.query;
  const where = {};
  if (userId) where.userId = userId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (transactionId) where.id = transactionId;
  if (from || to) where.createdAt = { ...(from && { [Op.gte]: new Date(from) }), ...(to && { [Op.lte]: new Date(to) }) };
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'publicId', 'email', 'firstName', 'lastName'] }],
    offset: (page - 1) * limit,
    limit: +limit,
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
});

// Invoices
exports.listMyInvoices = asyncHandler(async (req, res) => {
  const rows = await Invoice.findAll({
    where: { userId: req.user.id },
    order: [['issuedAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  const inv = await Invoice.findByPk(req.params.id);
  if (!inv) throw ApiError.notFound();
  if (req.user.role !== 'admin' && inv.userId !== req.user.id) throw ApiError.forbidden();
  invoiceSvc.streamPdf(inv, res);
});

// Bank accounts
exports.listBankAccounts = asyncHandler(async (req, res) => {
  const rows = await BankAccount.findAll({ where: { userId: req.user.id } });
  res.json({ success: true, data: rows });
});

exports.upsertBankAccount = asyncHandler(async (req, res) => {
  const body = { ...req.body, userId: req.user.id };
  if (body.isDefault) {
    await BankAccount.update({ isDefault: false }, { where: { userId: req.user.id } });
  }
  const row = req.params.id
    ? await (async () => {
        const r = await BankAccount.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!r) throw ApiError.notFound();
        return r.update(body);
      })()
    : await BankAccount.create(body);
  res.json({ success: true, data: row });
});

exports.deleteBankAccount = asyncHandler(async (req, res) => {
  const r = await BankAccount.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!r) throw ApiError.notFound();
  await r.destroy();
  res.json({ success: true });
});
