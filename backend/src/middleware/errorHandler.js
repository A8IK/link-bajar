const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message);
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${error.message}\n${err.stack}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    details: error.details || undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
