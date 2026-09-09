const { Wallet, Transaction, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ids = require('../utils/ids');

const getOrCreate = async (userId, t) => {
  let wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t?.LOCK?.UPDATE });
  if (!wallet) wallet = await Wallet.create({ userId }, { transaction: t });
  return wallet;
};

const credit = async ({ userId, amount, type, orderId, method, reference, notes, meta }, t) => {
  const wallet = await getOrCreate(userId, t);
  wallet.availableBalance = Number(wallet.availableBalance) + Number(amount);
  await wallet.save({ transaction: t });
  return Transaction.create(
    {
      userId,
      orderId,
      type,
      amount,
      method: method || 'wallet',
      status: 'completed',
      reference: reference || ids.transactionRef(),
      notes,
      meta,
    },
    { transaction: t },
  );
};

const debit = async ({ userId, amount, type, orderId, method, reference, notes, meta, fromBonus = false }, t) => {
  const wallet = await getOrCreate(userId, t);
  const avail = Number(wallet.availableBalance);
  const bonus = Number(wallet.bonusBalance);
  const total = avail + bonus;
  if (Number(amount) > total) throw ApiError.badRequest('Insufficient wallet balance');

  if (fromBonus && bonus > 0) {
    const useBonus = Math.min(bonus, Number(amount));
    wallet.bonusBalance = bonus - useBonus;
    const remaining = Number(amount) - useBonus;
    if (remaining > 0) wallet.availableBalance = avail - remaining;
  } else {
    wallet.availableBalance = avail - Number(amount);
  }
  await wallet.save({ transaction: t });
  return Transaction.create(
    {
      userId,
      orderId,
      type,
      amount,
      method: method || 'wallet',
      status: 'completed',
      reference: reference || ids.transactionRef(),
      notes,
      meta,
    },
    { transaction: t },
  );
};

const hold = async ({ userId, amount }, t) => {
  const wallet = await getOrCreate(userId, t);
  wallet.pendingBalance = Number(wallet.pendingBalance) + Number(amount);
  await wallet.save({ transaction: t });
  return wallet;
};

const release = async ({ userId, amount, toAvailable = true }, t) => {
  const wallet = await getOrCreate(userId, t);
  wallet.pendingBalance = Math.max(0, Number(wallet.pendingBalance) - Number(amount));
  if (toAvailable) wallet.availableBalance = Number(wallet.availableBalance) + Number(amount);
  await wallet.save({ transaction: t });
  return wallet;
};

module.exports = { getOrCreate, credit, debit, hold, release, sequelize };
