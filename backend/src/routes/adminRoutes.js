const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.get('/dashboard', ctrl.dashboard);
router.post('/settings/commission', ctrl.setCommission);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id', ctrl.updateUserStatus);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;
