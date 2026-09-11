const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Referral } = require('../models');
const referralSvc = require('../services/referralService');

exports.myStats = asyncHandler(async (req, res) => {
  const stats = await referralSvc.myStats(req.user.id);
  res.json({ success: true, data: stats });
});

exports.adminList = asyncHandler(async (req, res) => {
  const rows = await Referral.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: rows });
});

exports.adminUpdate = asyncHandler(async (req, res) => {
  const r = await Referral.findByPk(req.params.id);
  if (!r) throw ApiError.notFound();
  await r.update(req.body);
  res.json({ success: true, data: r });
});

exports.adminCreate = asyncHandler(async (req, res) => {
  const r = await Referral.create(req.body);
  res.status(201).json({ success: true, data: r });
});
