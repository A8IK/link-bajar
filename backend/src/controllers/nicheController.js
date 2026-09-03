const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Niche } = require('../models');

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

exports.list = asyncHandler(async (req, res) => {
  const rows = await Niche.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, isSensitive } = req.body;
  const slug = slugify(name);
  const existing = await Niche.findOne({ where: { slug } });
  if (existing) return res.json({ success: true, data: existing });
  const n = await Niche.create({ name, slug, isSensitive: !!isSensitive, createdById: req.user.id });
  res.status(201).json({ success: true, data: n });
});

exports.update = asyncHandler(async (req, res) => {
  const n = await Niche.findByPk(req.params.id);
  if (!n) throw ApiError.notFound();
  await n.update(req.body);
  res.json({ success: true, data: n });
});

exports.remove = asyncHandler(async (req, res) => {
  const n = await Niche.findByPk(req.params.id);
  if (!n) throw ApiError.notFound();
  await n.destroy();
  res.json({ success: true });
});
