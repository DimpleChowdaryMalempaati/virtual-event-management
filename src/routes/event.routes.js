const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const eventController = require('../controllers/event.controller');
const {
  eventIdParamValidation,
  createEventValidation,
  updateEventValidation,
} = require('../validators/event.validator');

const router = express.Router();

router.get('/', authenticate, asyncHandler(eventController.getEvents));
router.get('/my/registrations', authenticate, authorize('attendee'), asyncHandler(eventController.getMyRegistrations));

router.get(
  '/:id',
  authenticate,
  validate(eventIdParamValidation),
  asyncHandler(eventController.getEvent)
);

router.post(
  '/',
  authenticate,
  authorize('organizer'),
  validate(createEventValidation),
  asyncHandler(eventController.createEvent)
);

router.put(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate([...eventIdParamValidation, ...updateEventValidation]),
  asyncHandler(eventController.updateEvent)
);

router.delete(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate(eventIdParamValidation),
  asyncHandler(eventController.deleteEvent)
);

router.post(
  '/:id/register',
  authenticate,
  authorize('attendee'),
  validate(eventIdParamValidation),
  asyncHandler(eventController.registerForEvent)
);

router.delete(
  '/:id/register',
  authenticate,
  authorize('attendee'),
  validate(eventIdParamValidation),
  asyncHandler(eventController.cancelRegistration)
);

module.exports = router;
