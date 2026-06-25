const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authController = require('../controllers/auth.controller');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  logoutValidation,
} = require('../validators/auth.validator');
const {
  loginRateLimiter,
  registerRateLimiter,
} = require('../middleware/security');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  registerRateLimiter,
  validate(registerValidation),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  loginRateLimiter,
  validate(loginValidation),
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  validate(refreshTokenValidation),
  asyncHandler(authController.refresh)
);

router.post(
  '/logout',
  authenticate,
  validate(logoutValidation),
  asyncHandler(authController.logout)
);

module.exports = router;
