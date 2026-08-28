const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error(`Redis error: ${err.code || err.message || err.toString()}`));

const connectRedis = async () => {
  if (redis.status === 'ready') return;
  if (redis.status === 'connecting' || redis.status === 'connect') {
    await new Promise((resolve, reject) => {
      redis.once('ready', resolve);
      redis.once('error', reject);
    });
    return;
  }
  await redis.connect();
};

const cacheGet = async (key) => {
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

const cacheDel = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(keys);
};

module.exports = { redis, connectRedis, cacheGet, cacheSet, cacheDel };
