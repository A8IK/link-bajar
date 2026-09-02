const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/listings', require('./listingRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/wallet', require('./walletRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/referrals', require('./referralRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/niches', require('./nicheRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
