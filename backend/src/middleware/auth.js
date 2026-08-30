const ApiError = require('../utils/ApiError');
const { verifyAccess } = require('../utils/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing access token');
    }
    const token = header.slice(7);
    const decoded = verifyAccess(token);

    const user = await User.findByPk(decoded.sub, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'blocked') throw ApiError.forbidden('Account blocked');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
  }
  next();
};

module.exports = { authenticate, requireRole };
