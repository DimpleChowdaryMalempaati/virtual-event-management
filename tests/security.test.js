const {
  request,
  app,
  organizerPayload,
  attendeePayload,
  validEvent,
  registerUser,
  loginUser,
  setupOrganizer,
  setupAttendee,
  createEventAs,
  resetTestStore,
} = require('./helpers');

beforeEach(() => {
  resetTestStore();
});

describe('Security hardening', () => {
  describe('Helmet security headers', () => {
    it('should set security headers on responses', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('CORS policy', () => {
    it('should allow requests from configured origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should allow second configured origin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should block requests from disallowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://malicious-site.com');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/CORS/i);
    });
  });

  describe('Input sanitization (express-validator)', () => {
    it('should escape HTML in registration name', async () => {
      const response = await registerUser({
        ...attendeePayload,
        email: 'xss@test.com',
        name: '<script>alert(1)</script>',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.name).not.toContain('<script>');
    });

    it('should reject invalid event creation input', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send({
          title: '',
          date: 'invalid-date',
          time: '25:99',
          description: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid event ID parameter', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .get('/events/not-a-number')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT access and refresh tokens', () => {
    it('should return access and refresh tokens on login', async () => {
      await registerUser(organizerPayload);
      const response = await loginUser(organizerPayload.email, organizerPayload.password);

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should rotate refresh token on refresh', async () => {
      await registerUser(organizerPayload);
      const loginResponse = await loginUser(organizerPayload.email, organizerPayload.password);
      const { refreshToken } = loginResponse.body.data;

      const response = await request(app).post('/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should invalidate old refresh token after rotation', async () => {
      await registerUser(organizerPayload);
      const loginResponse = await loginUser(organizerPayload.email, organizerPayload.password);
      const { refreshToken } = loginResponse.body.data;

      await request(app).post('/refresh').send({ refreshToken });

      const response = await request(app).post('/refresh').send({ refreshToken });
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should blacklist tokens on logout', async () => {
      const session = await setupOrganizer();

      await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ refreshToken: session.refreshToken });

      const accessResponse = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${session.accessToken}`);

      expect(accessResponse.status).toBe(401);

      const refreshResponse = await request(app)
        .post('/refresh')
        .send({ refreshToken: session.refreshToken });

      expect(refreshResponse.status).toBe(401);
    });

    it('should reject using refresh token as access token', async () => {
      const session = await setupOrganizer();

      const response = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${session.refreshToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Role-based authorization', () => {
    it('should block attendee from creating events', async () => {
      const attendee = await setupAttendee();

      const response = await createEventAs(attendee.accessToken, validEvent());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should block attendee from updating events', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .put('/events/1')
        .set('Authorization', `Bearer ${attendee.accessToken}`)
        .send({ title: 'Hacked' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should block attendee from deleting events', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .delete('/events/1')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
