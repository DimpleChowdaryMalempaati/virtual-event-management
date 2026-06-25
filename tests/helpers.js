const request = require('supertest');
const { resetStore } = require('../src/data/store');
const app = require('../src/app');

const organizerPayload = {
  name: 'Alice Organizer',
  email: 'alice@test.com',
  password: 'password123',
  role: 'organizer',
};

const organizer2Payload = {
  name: 'Carol Organizer',
  email: 'carol@test.com',
  password: 'password123',
  role: 'organizer',
};

const attendeePayload = {
  name: 'Bob Attendee',
  email: 'bob@test.com',
  password: 'password123',
  role: 'attendee',
};

function validEvent(overrides = {}) {
  return {
    title: 'Tech Meetup',
    date: '2026-08-15',
    time: '14:00',
    description: 'A virtual technology meetup',
    ...overrides,
  };
}

function registerUser(payload) {
  return request(app).post('/register').send(payload);
}

function loginUser(email, password) {
  return request(app).post('/login').send({ email, password });
}

async function setupOrganizer(payload = organizerPayload) {
  await registerUser(payload);
  const response = await loginUser(payload.email, payload.password);
  return response.body.data;
}

async function setupAttendee(payload = attendeePayload) {
  await registerUser(payload);
  const response = await loginUser(payload.email, payload.password);
  return response.body.data;
}

async function createEventAs(accessToken, eventData = validEvent()) {
  return request(app)
    .post('/events')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(eventData);
}

function resetTestStore() {
  resetStore();
}

module.exports = {
  app,
  request,
  organizerPayload,
  organizer2Payload,
  attendeePayload,
  validEvent,
  registerUser,
  loginUser,
  setupOrganizer,
  setupAttendee,
  createEventAs,
  resetTestStore,
};
