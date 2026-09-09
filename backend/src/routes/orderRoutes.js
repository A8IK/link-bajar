const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.use(authenticate);

// Buyer
router.post(
  '/checkout',
  requireRole('buyer', 'agency', 'partnership', 'admin'),
  body('items').isArray({ min: 1 }),
  body('paymentMethod').optional().isIn(['wallet', 'payoneer', 'sslcommerz', 'stripe']),
  body('couponCode').optional().isString(),
  validate,
  ctrl.checkout,
);
router.get('/me', ctrl.listMine);
router.get('/:id', ctrl.getById);
router.get('/:id/messages', ctrl.listMessages);
router.post('/:id/messages', body('message').isString().notEmpty(), validate, ctrl.postMessage);
router.get('/:id/invoice', ctrl.invoiceFor);

// Admin
router.get('/', requireRole('admin'), ctrl.listAll);
router.patch(
  '/:id/status',
  requireRole('admin'),
  body('status').isIn(['pending', 'approved', 'in_progress', 'delivered', 'rejected', 'cancelled']),
  validate,
  ctrl.updateStatus,
);
router.delete('/:id', requireRole('admin'), ctrl.deleteOrder);

module.exports = router;
