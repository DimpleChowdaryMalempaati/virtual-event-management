const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { users, generateUserId } = require('../data/store');
const {
  generateTokenPair,
  verifyRefreshToken,
  revokeTokenPair,
} = require('./token.service');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function registerUser({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = users.find((u) => u.email === normalizedEmail);

  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    id: generateUserId(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  return sanitizeUser(user);
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === normalizedEmail);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const tokens = generateTokenPair(user);

  return {
    ...tokens,
    user: sanitizeUser(user),
  };
}

function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const user = users.find((u) => u.id === decoded.userId);

  if (!user) {
    throw ApiError.unauthorized('User account no longer exists. Please log in again.');
  }

  revokeTokenPair(null, refreshToken);

  const tokens = generateTokenPair(user);

  return {
    ...tokens,
    user: sanitizeUser(user),
  };
}

function logoutUser({ accessToken, refreshToken }) {
  revokeTokenPair(accessToken, refreshToken);
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
