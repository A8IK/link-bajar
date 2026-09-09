const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Order, OrderMessage, Listing, User, Invoice } = require('../models');
const orderSvc = require('../services/orderService');
const invoiceSvc = require('../services/invoiceService');
const { getIO } = require('../sockets');

exports.checkout = asyncHandler(async (req, res) => {
  const { items, paymentMethod, couponCode } = req.body;
  const orders = await orderSvc.createForBuyer({
    buyerId: req.user.id,
    items,
    paymentMethod: paymentMethod || 'wallet',
    couponCode,
  });
  res.status(201).json({ success: true, data: orders });
});

exports.listMine = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = { buyerId: req.user.id };
  if (status) where.status = status;
  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: Listing, as: 'listing' }],
    offset: (page - 1) * limit,
    limit: +limit,
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
});

exports.getById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: Listing, as: 'listing' },
      { model: User, as: 'buyer', attributes: ['id', 'email', 'firstName', 'lastName', 'publicId'] },
      { model: OrderMessage, as: 'messages', include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }] },
    ],
  });
  if (!order) throw ApiError.notFound();
  if (req.user.role !== 'admin' && order.buyerId !== req.user.id) throw ApiError.forbidden();
  res.json({ success: true, data: order });
});

exports.listAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  const include = [
    { model: Listing, as: 'listing' },
    { model: User, as: 'buyer', attributes: ['id', 'email', 'firstName', 'lastName', 'publicId'] },
  ];
  if (search) {
    where[Op.or] = [
      { orderNumber: { [Op.iLike]: `%${search}%` } },
      { orderedSite: { [Op.iLike]: `%${search}%` } },
      { '$buyer.email$': { [Op.iLike]: `%${search}%` } },
      { '$buyer.publicId$': { [Op.iLike]: `%${search}%` } },
    ];
  }
  const { rows, count } = await Order.findAndCountAll({
    where,
    include,
    offset: (page - 1) * limit,
    limit: +limit,
    order: [['createdAt', 'DESC']],
    subQuery: false,
  });
  res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, liveLink, rejectionReason } = req.body;
  const order = await orderSvc.updateStatus({
    orderId: req.params.id,
    status,
    liveLink,
    rejectionReason,
  });
  res.json({ success: true, data: order });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound();
  await order.destroy();
  res.json({ success: true });
});

exports.postMessage = asyncHandler(async (req, res) => {
  const { message, attachmentUrl } = req.body;
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound();
  const isBuyer = order.buyerId === req.user.id;
  if (!isBuyer && req.user.role !== 'admin') throw ApiError.forbidden();

  const msg = await OrderMessage.create({
    orderId: order.id,
    senderId: req.user.id,
    senderRole: req.user.role,
    message,
    attachmentUrl,
  });

  try {
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:message', {
      ...msg.toJSON(),
      sender: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName, role: req.user.role },
    });
    const target = isBuyer ? 'role:admin' : `user:${order.buyerId}`;
    io.to(target).emit('order:notify', { orderId: order.id, preview: message.slice(0, 80) });
  } catch (_) { /* */ }

  res.status(201).json({ success: true, data: msg });
});

exports.listMessages = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound();
  if (req.user.role !== 'admin' && order.buyerId !== req.user.id) throw ApiError.forbidden();
  const messages = await OrderMessage.findAll({
    where: { orderId: order.id },
    include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }],
    order: [['createdAt', 'ASC']],
  });
  res.json({ success: true, data: messages });
});

exports.invoiceFor = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ where: { orderId: req.params.id } });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  if (req.user.role !== 'admin' && invoice.userId !== req.user.id) throw ApiError.forbidden();
  invoiceSvc.streamPdf(invoice, res);
});
