const { body, param } = require('express-validator');

const eventIdParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer.'),
];

const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters.')
    .escape(),
  body('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required.')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format.'),
  body('time')
    .trim()
    .notEmpty()
    .withMessage('Time is required.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format (24-hour).'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters.')
    .escape(),
];

const updateEventValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters.')
    .escape(),
  body('date')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format.'),
  body('time')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format (24-hour).'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty.')
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters.')
    .escape(),
  body().custom((_, { req }) => {
    const hasUpdate = ['title', 'date', 'time', 'description'].some(
      (field) => req.body[field] !== undefined
    );

    if (!hasUpdate) {
      throw new Error('At least one field (title, date, time, description) must be provided to update.');
    }

    return true;
  }),
];

module.exports = {
  eventIdParamValidation,
  createEventValidation,
  updateEventValidation,
};
