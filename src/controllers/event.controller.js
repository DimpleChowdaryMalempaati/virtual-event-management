const eventService = require('../services/event.service');
const parseId = require('../utils/parseId');
const { sendSuccess } = require('../utils/response');

async function getEvents(req, res) {
  const events = eventService.getAllEvents();

  sendSuccess(res, {
    message: events.length > 0 ? 'Events retrieved successfully.' : 'No events found.',
    data: events,
    meta: { count: events.length },
  });
}

async function getEvent(req, res) {
  const eventId = parseId(req.params.id, 'Event');
  const event = eventService.getEventById(eventId);

  sendSuccess(res, {
    message: 'Event retrieved successfully.',
    data: event,
  });
}

async function createEvent(req, res) {
  const event = eventService.createEvent(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Event created successfully.',
    data: event,
  });
}

async function updateEvent(req, res) {
  const eventId = parseId(req.params.id, 'Event');
  const event = eventService.updateEvent(eventId, req.user.id, req.body);

  sendSuccess(res, {
    message: 'Event updated successfully.',
    data: event,
  });
}

async function deleteEvent(req, res) {
  const eventId = parseId(req.params.id, 'Event');
  eventService.deleteEvent(eventId, req.user.id);

  sendSuccess(res, {
    message: 'Event deleted successfully.',
  });
}

async function registerForEvent(req, res) {
  const eventId = parseId(req.params.id, 'Event');
  const event = await eventService.registerForEvent(eventId, req.user);

  sendSuccess(res, {
    message: 'Successfully registered for the event. A confirmation email has been sent.',
    data: { event },
  });
}

async function getMyRegistrations(req, res) {
  const registrations = eventService.getUserRegistrations(req.user.id);

  sendSuccess(res, {
    message:
      registrations.length > 0
        ? 'Your event registrations retrieved successfully.'
        : 'You have not registered for any events yet.',
    data: registrations,
    meta: { count: registrations.length },
  });
}

async function cancelRegistration(req, res) {
  const eventId = parseId(req.params.id, 'Event');
  const event = eventService.cancelRegistration(eventId, req.user.id);

  sendSuccess(res, {
    message: 'Event registration cancelled successfully.',
    data: { event },
  });
}

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
};
