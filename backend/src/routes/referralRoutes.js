const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/referralController');

router.use(authenticate);

router.get('/me', ctrl.myStats);

router.get('/', requireRole('admin'), ctrl.adminList);
router.post('/', requireRole('admin'), ctrl.adminCreate);
router.patch('/:id', requireRole('admin'), ctrl.adminUpdate);

module.exports = router;
