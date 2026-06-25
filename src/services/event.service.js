const ApiError = require('../utils/ApiError');
const { users, events, generateEventId } = require('../data/store');
const { sendRegistrationEmail } = require('./email.service');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function formatEvent(event) {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    description: event.description,
    organizerId: event.organizerId,
    participants: [...event.participants],
    participantCount: event.participants.length,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function getOrganizerName(organizerId) {
  const organizer = users.find((u) => u.id === organizerId);
  return organizer ? organizer.name : 'Unknown';
}

function validateEventFields({ title, date, time, description }, { partial = false } = {}) {
  const errors = [];

  if (!partial || title !== undefined) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.push({ field: 'title', message: 'Title is required.' });
    }
  }

  if (!partial || date !== undefined) {
    if (!date || typeof date !== 'string') {
      errors.push({ field: 'date', message: 'Date is required.' });
    } else if (!DATE_REGEX.test(date)) {
      errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format.' });
    }
  }

  if (!partial || time !== undefined) {
    if (!time || typeof time !== 'string') {
      errors.push({ field: 'time', message: 'Time is required.' });
    } else if (!TIME_REGEX.test(time)) {
      errors.push({ field: 'time', message: 'Time must be in HH:MM format (24-hour).' });
    }
  }

  if (!partial || description !== undefined) {
    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push({ field: 'description', message: 'Description is required.' });
    }
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Event validation failed.', errors);
  }
}

function getAllEvents() {
  return events.map((event) => ({
    ...formatEvent(event),
    organizerName: getOrganizerName(event.organizerId),
  }));
}

function getEventById(eventId) {
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    throw ApiError.notFound('Event not found.');
  }

  return {
    ...formatEvent(event),
    organizerName: getOrganizerName(event.organizerId),
  };
}

function createEvent(organizerId, eventData) {
  validateEventFields(eventData);

  const event = {
    id: generateEventId(),
    title: eventData.title.trim(),
    date: eventData.date,
    time: eventData.time,
    description: eventData.description.trim(),
    organizerId,
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events.push(event);

  return {
    ...formatEvent(event),
    organizerName: getOrganizerName(organizerId),
  };
}

function updateEvent(eventId, organizerId, updates) {
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    throw ApiError.notFound('Event not found.');
  }

  if (event.organizerId !== organizerId) {
    throw ApiError.forbidden('You can only update events that you created.');
  }

  const allowedFields = ['title', 'date', 'time', 'description'];
  const hasUpdates = allowedFields.some((field) => updates[field] !== undefined);

  if (!hasUpdates) {
    throw ApiError.badRequest('At least one field (title, date, time, description) must be provided to update.');
  }

  validateEventFields(updates, { partial: true });

  if (updates.title !== undefined) event.title = updates.title.trim();
  if (updates.date !== undefined) event.date = updates.date;
  if (updates.time !== undefined) event.time = updates.time;
  if (updates.description !== undefined) event.description = updates.description.trim();

  event.updatedAt = new Date().toISOString();

  return {
    ...formatEvent(event),
    organizerName: getOrganizerName(event.organizerId),
  };
}

function deleteEvent(eventId, organizerId) {
  const eventIndex = events.findIndex((e) => e.id === eventId);

  if (eventIndex === -1) {
    throw ApiError.notFound('Event not found.');
  }

  const event = events[eventIndex];

  if (event.organizerId !== organizerId) {
    throw ApiError.forbidden('You can only delete events that you created.');
  }

  events.splice(eventIndex, 1);
}

async function registerForEvent(eventId, attendee) {
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    throw ApiError.notFound('Event not found.');
  }

  if (event.organizerId === attendee.id) {
    throw ApiError.badRequest('Organizers cannot register for their own events.');
  }

  if (event.participants.includes(attendee.id)) {
    throw ApiError.conflict('You are already registered for this event.');
  }

  event.participants.push(attendee.id);
  event.updatedAt = new Date().toISOString();

  try {
    await sendRegistrationEmail({
      to: attendee.email,
      userName: attendee.name,
      event: formatEvent(event),
    });
  } catch (error) {
    event.participants.pop();
    event.updatedAt = new Date().toISOString();
    throw error;
  }

  return {
    ...formatEvent(event),
    organizerName: getOrganizerName(event.organizerId),
  };
}

function getUserRegistrations(userId) {
  const registeredEvents = events.filter((event) => event.participants.includes(userId));

  return registeredEvents.map((event) => ({
    ...formatEvent(event),
    organizerName: getOrganizerName(event.organizerId),
  }));
}

function cancelRegistration(eventId, userId) {
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    throw ApiError.notFound('Event not found.');
  }

  const participantIndex = event.participants.indexOf(userId);

  if (participantIndex === -1) {
    throw ApiError.notFound('You are not registered for this event.');
  }

  event.participants.splice(participantIndex, 1);
  event.updatedAt = new Date().toISOString();

  return formatEvent(event);
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getUserRegistrations,
  cancelRegistration,
};
