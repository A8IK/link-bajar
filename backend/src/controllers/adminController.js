const { Op, fn, col } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { User, Listing, Order, Transaction, sequelize } = require('../models');

const SETTINGS_KEY = 'admin:settings';
const KEYS = { universalCommission: 'universal_commission_pct' };

// Lightweight key/value settings via Redis (no schema bloat)
const { redis } = require('../config/redis');

exports.dashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    liveListings,
    pendingListings,
    pendingOrders,
    approvedOrders,
    rejectedOrders,
  ] = await Promise.all([
    User.count(),
    Listing.count({ where: { status: 'approved' } }),
    Listing.count({ where: { status: 'pending' } }),
    Order.count({ where: { status: 'pending' } }),
    Order.count({ where: { status: { [Op.in]: ['approved', 'in_progress', 'delivered'] } } }),
    Order.count({ where: { status: 'rejected' } }),
  ]);

  const earningsRow = await Order.findAll({
    where: { paymentStatus: 'paid' },
    attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
    raw: true,
  });
  const totalEarnings = Number(earningsRow[0]?.total || 0);

  const universalCommission = Number((await redis.get(`${SETTINGS_KEY}:${KEYS.universalCommission}`)) || 20);

  res.json({
    success: true,
    data: {
      totalUsers,
      liveListings,
      pendingListings,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalEarnings,
      universalCommission,
    },
  });
});

exports.setCommission = asyncHandler(async (req, res) => {
  const { value } = req.body;
  if (typeof value !== 'number') throw ApiError.badRequest('value must be a number');
  await redis.set(`${SETTINGS_KEY}:${KEYS.universalCommission}`, String(value));
  res.json({ success: true, data: { universalCommission: value } });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, role, status, search } = req.query;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { publicId: { [Op.iLike]: `%${search}%` } },
    ];
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    offset: (page - 1) * limit,
    limit: +limit,
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status, role } = req.body;
  const u = await User.findByPk(req.params.id);
  if (!u) throw ApiError.notFound();
  if (status) u.status = status;
  if (role) u.role = role;
  await u.save();
  res.json({ success: true, data: { id: u.id, status: u.status, role: u.role } });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) throw ApiError.notFound();
  await u.destroy();
  res.json({ success: true });
});
