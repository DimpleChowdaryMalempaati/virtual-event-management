const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters.')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters.'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(['organizer', 'attendee'])
    .withMessage('Role must be either "organizer" or "attendee".'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .notEmpty()
    .withMessage('Password is required.'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token is required.')
    .notEmpty()
    .withMessage('Refresh token is required.'),
];

const logoutValidation = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token is required.')
    .notEmpty()
    .withMessage('Refresh token is required.'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  logoutValidation,
};
