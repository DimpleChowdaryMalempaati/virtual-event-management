const ApiError = require('../utils/ApiError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required. Please log in.'));
  }

  if (!roles.includes(req.user.role)) {
    const roleList = roles.join(' or ');
    return next(
      ApiError.forbidden(`Access denied. This action requires ${roleList} privileges.`)
    );
  }

  next();
};

module.exports = authorize;
