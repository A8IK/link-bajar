const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redis } = require('../config/redis');
const config = require('../config');

const baseLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'development' ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  message: 'Too many auth attempts, try again later.',
});

module.exports = { baseLimiter, authLimiter };
