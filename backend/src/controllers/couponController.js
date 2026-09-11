const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Coupon, User } = require('../models');
const couponSvc = require('../services/couponService');
const mailer = require('../services/mailer');

exports.create = asyncHandler(async (req, res) => {
  const c = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: c });
});

exports.list = asyncHandler(async (req, res) => {
  const rows = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: rows });
});

exports.update = asyncHandler(async (req, res) => {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) throw ApiError.notFound();
  await c.update(req.body);
  res.json({ success: true, data: c });
});

exports.remove = asyncHandler(async (req, res) => {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) throw ApiError.notFound();
  await c.destroy();
  res.json({ success: true });
});

exports.validate = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const { coupon, discount } = await couponSvc.validate({
    code,
    userId: req.user.id,
    orderAmount,
  });
  res.json({ success: true, data: { coupon: { id: coupon.id, code: coupon.code }, discount } });
});

exports.broadcast = asyncHandler(async (req, res) => {
  const { couponId, message } = req.body;
  const coupon = await Coupon.findByPk(couponId);
  if (!coupon) throw ApiError.notFound();
  const users = await User.findAll({ where: { status: 'active' }, attributes: ['email', 'firstName'] });
  let sent = 0;
  for (const u of users) {
    const tpl = mailer.templates.couponBlast({ name: u.firstName, code: coupon.code, message });
    mailer.send({ to: u.email, ...tpl }).then(() => sent++).catch(() => {});
  }
  res.json({ success: true, queued: users.length });
});
