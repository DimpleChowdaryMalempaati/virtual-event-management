const tokenService = require('../services/token.service');
const ApiError = require('../utils/ApiError');
const { users } = require('../data/store');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized('Authentication required. Provide a valid Bearer token in the Authorization header.')
    );
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is missing.'));
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);
    const user = users.find((u) => u.id === decoded.userId);

    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists. Please register again.'));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.token = token;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired. Please refresh your token or log in again.'));
    }

    return next(ApiError.unauthorized('Invalid authentication token.'));
  }
};

module.exports = authenticate;
