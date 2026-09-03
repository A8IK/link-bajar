const router = require('express').Router();
const { Op } = require('sequelize');
const multer = require('multer');
const xlsx = require('xlsx');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Listing, WishlistItem, User } = require('../models');
const { cacheGet, cacheSet, cacheDel, redis } = require('../config/redis');
const config = require('../config');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxMb * 1024 * 1024 },
});

// Public marketplace listing (cached)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, niche, placementType, language, search, minDa, maxPrice } = req.query;
    const cacheKey = `listings:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, cached: true, data: cached });

    const where = { status: 'approved' };
    if (placementType) where.placementType = placementType;
    if (language) where.language = language;
    if (minDa) where.mozDa = { [Op.gte]: +minDa };
    if (maxPrice) {
      where[Op.or] = [
        { guestPostPrice: { [Op.lte]: +maxPrice } },
        { linkInsertPrice: { [Op.lte]: +maxPrice } },
      ];
    }
    if (search) {
      where.siteUrl = { [Op.iLike]: `%${search}%` };
    }
    if (niche) {
      where.subNiches = { [Op.contains]: [niche] };
    }

    const { rows, count } = await Listing.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    const payload = { items: rows, total: count, page: +page, limit: +limit };
    await cacheSet(cacheKey, payload, 60);
    res.json({ success: true, data: payload });
  }),
);

// Authenticated routes follow
router.use(authenticate);

// My listings (seller)
router.get(
  '/mine',
  requireRole('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const where = req.user.role === 'admin' ? {} : { sellerId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    const rows = await Listing.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: rows });
  }),
);

// Admin: list all with filters
router.get(
  '/all',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.siteUrl = { [Op.iLike]: `%${search}%` };
    const { rows, count } = await Listing.findAndCountAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['id', 'email', 'publicId'] }],
      offset: (page - 1) * limit,
      limit: +limit,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { items: rows, total: count, page: +page, limit: +limit } });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const l = await Listing.findByPk(req.params.id);
    if (!l) throw ApiError.notFound();
    res.json({ success: true, data: l });
  }),
);

// Seller / admin: create single listing
router.post(
  '/',
  requireRole('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const dup = await Listing.findOne({ where: { siteUrl: req.body.siteUrl } });
    if (dup) throw ApiError.conflict('A listing already exists for this site');
    const listing = await Listing.create({
      ...req.body,
      sellerId: req.user.role === 'seller' ? req.user.id : req.body.sellerId,
      addedBySellerEmail: req.user.role === 'seller' ? req.user.email : null,
      addedByAdminEmail: req.user.role === 'admin' ? req.user.email : null,
      source: req.user.role === 'admin' ? 'admin' : 'seller',
      status: req.user.role === 'admin' ? 'approved' : 'pending',
    });
    await cacheDel('listings:*');
    res.status(201).json({ success: true, data: listing });
  }),
);

// Update (seller — only own; admin — any)
router.put(
  '/:id',
  requireRole('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const l = await Listing.findByPk(req.params.id);
    if (!l) throw ApiError.notFound();
    if (req.user.role === 'seller' && l.sellerId !== req.user.id) throw ApiError.forbidden();
    await l.update(req.body);
    await cacheDel('listings:*');
    res.json({ success: true, data: l });
  }),
);

router.delete(
  '/:id',
  requireRole('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const l = await Listing.findByPk(req.params.id);
    if (!l) throw ApiError.notFound();
    if (req.user.role === 'seller' && l.sellerId !== req.user.id) throw ApiError.forbidden();
    await l.destroy();
    await cacheDel('listings:*');
    res.json({ success: true });
  }),
);

// Admin moderation
router.patch(
  '/:id/status',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { status, rejectionReason, commission, sellerPrice } = req.body;
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) throw ApiError.notFound();
    if (status) listing.status = status;
    if (rejectionReason) listing.rejectionReason = rejectionReason;
    if (commission != null) listing.commission = commission;
    if (sellerPrice != null) listing.sellerPrice = sellerPrice;
    await listing.save();
    await cacheDel('listings:*');
    res.json({ success: true, data: listing });
  }),
);

// Bulk upload (xlsx)
router.post(
  '/bulk',
  requireRole('admin', 'seller'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Missing file');
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const universalCommission = Number((await redis.get('admin:settings:universal_commission_pct')) || 20);

    const created = [];
    const skipped = [];
    for (const r of rows) {
      const siteUrl = r.siteUrl || r.site || r.SiteURL || r.url;
      if (!siteUrl) { skipped.push({ row: r, reason: 'missing siteUrl' }); continue; }
      const dup = await Listing.findOne({ where: { siteUrl } });
      if (dup) { skipped.push({ row: r, reason: 'duplicate' }); continue; }

      const placementType = r.placementType || r.type || 'guest_post';
      const guestPostPrice = r.guestPostPrice ?? r.price ?? null;
      const linkInsertPrice = r.linkInsertPrice ?? null;

      try {
        const l = await Listing.create({
          siteUrl,
          siteEmail: r.email,
          mozDa: r.mozDa ?? r.DA,
          ahrefDr: r.ahrefDr ?? r.DR,
          monthlyTraffic: r.monthlyTraffic ?? r.traffic,
          language: r.language ?? 'en',
          trafficCountry: r.trafficCountry,
          tatDays: r.tatDays ?? r.TAT,
          backlinkType: r.backlinkType || 'do_follow',
          placementType,
          guestPostPrice,
          linkInsertPrice,
          sellerPrice: r.sellerPrice,
          commission: r.commission ?? universalCommission,
          spamScore: r.spamScore,
          source: 'bulk',
          status: req.user.role === 'admin' ? 'approved' : 'pending',
          sellerId: req.user.role === 'seller' ? req.user.id : r.sellerId || null,
          addedByAdminEmail: req.user.role === 'admin' ? req.user.email : null,
          addedBySellerEmail: req.user.role === 'seller' ? req.user.email : null,
        });
        created.push(l.id);
      } catch (err) {
        skipped.push({ row: r, reason: err.message });
      }
    }

    await cacheDel('listings:*');
    res.status(201).json({ success: true, data: { createdCount: created.length, skippedCount: skipped.length, skipped } });
  }),
);

// Wishlist (buyer)
router.get('/wishlist/me', asyncHandler(async (req, res) => {
  const rows = await WishlistItem.findAll({
    where: { userId: req.user.id },
    include: [{ model: Listing }],
  });
  res.json({ success: true, data: rows });
}));

router.post('/:id/wishlist', asyncHandler(async (req, res) => {
  const [row, created] = await WishlistItem.findOrCreate({
    where: { userId: req.user.id, listingId: req.params.id },
  });
  res.status(created ? 201 : 200).json({ success: true, data: row });
}));

router.delete('/:id/wishlist', asyncHandler(async (req, res) => {
  await WishlistItem.destroy({ where: { userId: req.user.id, listingId: req.params.id } });
  res.json({ success: true });
}));

module.exports = router;
