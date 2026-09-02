const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Wallet, sequelize } = require('../models');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { redis } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const referralService = require('./referralService');

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const generatePublicId = () =>
  'LB' + crypto.randomBytes(5).toString('hex').toUpperCase();

const generateReferralCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

const issueTokens = async (user) => {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh({ sub: user.id });
  await redis.set(`refresh:${user.id}:${refreshToken}`, '1', 'EX', REFRESH_TTL_SECONDS);
  return { accessToken, refreshToken };
};

const register = async ({ email, password, firstName, lastName, role, referredByCode, ip, location }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered');

  return sequelize.transaction(async (t) => {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create(
      {
        email,
        passwordHash,
        firstName,
        lastName,
        role: ['buyer', 'seller', 'agency', 'partnership'].includes(role) ? role : 'buyer',
        publicId: generatePublicId(),
        referralCode: generateReferralCode(),
        referredByCode,
        registrationIp: ip,
        registrationLocation: location,
      },
      { transaction: t },
    );
    await Wallet.create({ userId: user.id }, { transaction: t });
    if (referredByCode) {
      try {
        await referralService.attribute({ newUser: user, referredByCode });
      } catch (_) { /* don't fail signup on referral attribution */ }
    }
    return user;
  });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status === 'blocked') throw ApiError.forbidden('Account blocked');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokens(user);
  return { user: stripUser(user), ...tokens };
};

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  const exists = await redis.get(`refresh:${decoded.sub}:${refreshToken}`);
  if (!exists) throw ApiError.unauthorized('Refresh token revoked');

  const user = await User.findByPk(decoded.sub);
  if (!user) throw ApiError.unauthorized('User not found');

  await redis.del(`refresh:${decoded.sub}:${refreshToken}`);
  const tokens = await issueTokens(user);
  return { user: stripUser(user), ...tokens };
};

const logout = async (userId, refreshToken) => {
  if (refreshToken) await redis.del(`refresh:${userId}:${refreshToken}`);
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length) await redis.del(keys);
};

const stripUser = (u) => {
  const o = u.toJSON ? u.toJSON() : { ...u };
  delete o.passwordHash;
  return o;
};

module.exports = { register, login, refresh, logout };
