const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/walletController');

router.use(authenticate);

router.get('/', ctrl.getMyWallet);
router.get('/transactions', ctrl.listTransactions);

router.post(
  '/deposits/intent',
  body('amount').isFloat({ gt: 0 }),
  body('method').optional().isIn(['payoneer', 'sslcommerz', 'stripe']),
  validate,
  ctrl.depositIntent,
);
router.post('/deposits/confirm', body('transactionId').isUUID(), validate, ctrl.confirmDeposit);

router.post(
  '/withdrawals',
  body('amount').isFloat({ gt: 0 }),
  body('requestedMethod').isIn(['payoneer', 'sslcommerz', 'bank']),
  validate,
  ctrl.requestWithdrawal,
);
router.get('/withdrawals/me', ctrl.listMyWithdrawals);

router.post('/refunds', body('amount').isFloat({ gt: 0 }), body('reason').isString(), validate, ctrl.requestRefund);

router.get('/invoices', ctrl.listMyInvoices);
router.get('/invoices/:id/download', ctrl.downloadInvoice);

router.get('/bank-accounts', ctrl.listBankAccounts);
router.post('/bank-accounts', ctrl.upsertBankAccount);
router.put('/bank-accounts/:id', ctrl.upsertBankAccount);
router.delete('/bank-accounts/:id', ctrl.deleteBankAccount);

// Admin
router.get('/admin/transactions', requireRole('admin'), ctrl.adminListTransactions);
router.get('/admin/withdrawals', requireRole('admin'), ctrl.adminListWithdrawals);
router.post('/admin/withdrawals/:id/process', requireRole('admin'), ctrl.adminProcessWithdrawal);
router.post('/admin/refunds', requireRole('admin'), ctrl.adminProcessRefund);

module.exports = router;
