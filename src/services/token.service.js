const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { blacklistToken, isTokenBlacklisted } = require('../data/store');

function createJti() {
  return crypto.randomUUID();
}

function generateAccessToken(user) {
  const jti = createJti();

  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      type: 'access',
      jti,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  );

  return { accessToken, jti };
}

function generateRefreshToken(user) {
  const jti = createJti();

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      type: 'refresh',
      jti,
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { refreshToken, jti };
}

function generateTokenPair(user) {
  const access = generateAccessToken(user);
  const refresh = generateRefreshToken(user);

  return {
    accessToken: access.accessToken,
    refreshToken: refresh.refreshToken,
  };
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, config.jwt.secret);

  if (decoded.type !== 'access') {
    throw ApiError.unauthorized('Invalid token type. Access token required.');
  }

  if (isTokenBlacklisted(decoded.jti)) {
    throw ApiError.unauthorized('Token has been revoked. Please log in again.');
  }

  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, config.jwt.refreshSecret);

  if (decoded.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid token type. Refresh token required.');
  }

  if (isTokenBlacklisted(decoded.jti)) {
    throw ApiError.unauthorized('Refresh token has been revoked. Please log in again.');
  }

  return decoded;
}

function revokeToken(token, secret) {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.jti || !decoded.exp) {
    return;
  }

  blacklistToken(decoded.jti, decoded.exp);
}

function revokeTokenPair(accessToken, refreshToken) {
  if (accessToken) {
    revokeToken(accessToken, config.jwt.secret);
  }

  if (refreshToken) {
    revokeToken(refreshToken, config.jwt.refreshSecret);
  }
}

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  revokeTokenPair,
};
