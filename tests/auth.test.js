const {
  request,
  app,
  organizerPayload,
  attendeePayload,
  registerUser,
  loginUser,
  setupOrganizer,
  resetTestStore,
} = require('./helpers');

beforeEach(() => {
  resetTestStore();
});

describe('Authentication API', () => {
  describe('POST /register', () => {
    it('should register an organizer successfully', async () => {
      const response = await registerUser(organizerPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/created successfully/i);
      expect(response.body.data).toMatchObject({
        name: organizerPayload.name,
        email: organizerPayload.email,
        role: 'organizer',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('should register an attendee successfully', async () => {
      const response = await registerUser(attendeePayload);

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('attendee');
    });

    it('should reject duplicate email with 409', async () => {
      await registerUser(organizerPayload);
      const response = await registerUser(organizerPayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists/i);
    });

    it('should reject invalid input with validation errors', async () => {
      const response = await registerUser({
        name: '',
        email: 'bad-email',
        password: '123',
        role: 'admin',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed.');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should normalize email to lowercase', async () => {
      const response = await registerUser({
        ...organizerPayload,
        email: 'ALICE@TEST.COM',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe('alice@test.com');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await registerUser(organizerPayload);
    });

    it('should login with valid credentials and return tokens', async () => {
      const response = await loginUser(organizerPayload.email, organizerPayload.password);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/login successful/i);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(organizerPayload.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject wrong password with 401', async () => {
      const response = await loginUser(organizerPayload.email, 'wrongpassword');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject non-existent user with 401', async () => {
      const response = await loginUser('nobody@test.com', 'password123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing fields with validation errors', async () => {
      const response = await request(app).post('/login').send({ email: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /refresh', () => {
    it('should issue new token pair with valid refresh token', async () => {
      await registerUser(organizerPayload);
      const loginResponse = await loginUser(organizerPayload.email, organizerPayload.password);
      const { refreshToken } = loginResponse.body.data;

      const response = await request(app).post('/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/refreshed successfully/i);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app).post('/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app).post('/refresh').send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /logout', () => {
    it('should logout and revoke tokens', async () => {
      const session = await setupOrganizer();

      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ refreshToken: session.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/revoked/i);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/logout').send({ refreshToken: 'some-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require refresh token in body', async () => {
      const session = await setupOrganizer();

      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected route authentication', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await request(app).get('/events');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/authentication required/i);
    });

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/events')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/events')
        .set('Authorization', 'NotBearer sometoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
