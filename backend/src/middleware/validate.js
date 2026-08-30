const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  next(ApiError.badRequest('Validation failed', errors.array()));
};
