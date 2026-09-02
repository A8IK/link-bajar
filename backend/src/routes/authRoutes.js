const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/authController');

router.post(
  '/register',
  authLimiter,
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('role').optional().isIn(['buyer', 'seller', 'agency', 'partnership']),
  validate,
  ctrl.register,
);

router.post(
  '/login',
  authLimiter,
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  validate,
  ctrl.login,
);

router.post('/refresh', body('refreshToken').isString().notEmpty(), validate, ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
