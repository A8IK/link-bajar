const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/couponController');

router.use(authenticate);

router.post('/validate', body('code').isString(), body('orderAmount').isFloat({ gt: 0 }), validate, ctrl.validate);

router.get('/', requireRole('admin'), ctrl.list);
router.post('/', requireRole('admin'), ctrl.create);
router.put('/:id', requireRole('admin'), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);
router.post('/broadcast', requireRole('admin'), ctrl.broadcast);

module.exports = router;
