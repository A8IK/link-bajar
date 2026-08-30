const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccess = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

const signRefresh = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

const verifyAccess = (token) => jwt.verify(token, config.jwt.accessSecret);
const verifyRefresh = (token) => jwt.verify(token, config.jwt.refreshSecret);

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
