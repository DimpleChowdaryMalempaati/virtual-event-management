const {
  request,
  app,
  validEvent,
  setupOrganizer,
  setupAttendee,
  createEventAs,
  resetTestStore,
} = require('./helpers');

beforeEach(() => {
  resetTestStore();
});

describe('Participant Management API', () => {
  describe('POST /events/:id/register', () => {
    it('should allow attendee to register for an event', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/registered/i);
      expect(response.body.data.event.participantCount).toBe(1);
      expect(response.body.data.event.participants).toContain(attendee.user.id);
    });

    it('should reject duplicate registration with 409', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      const response = await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already registered/i);
    });

    it('should forbid organizer from registering for their own event', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/attendee/i);
    });

    it('should forbid organizer role from registering (authorization)', async () => {
      const organizer1 = await setupOrganizer();
      const organizer2 = await setupOrganizer({
        name: 'Other Org',
        email: 'other@test.com',
        password: 'password123',
        role: 'organizer',
      });
      await createEventAs(organizer1.accessToken);

      const response = await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${organizer2.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent event', async () => {
      const attendee = await setupAttendee();

      const response = await request(app)
        .post('/events/999/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /events/my/registrations', () => {
    it('should return empty message when attendee has no registrations', async () => {
      const attendee = await setupAttendee();

      const response = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/not registered for any events/i);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.count).toBe(0);
    });

    it('should return attendee registered events', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken, validEvent({ title: 'Registered Event' }));

      await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      const response = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/retrieved successfully/i);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Registered Event');
      expect(response.body.meta.count).toBe(1);
    });

    it('should forbid organizer from accessing attendee registrations endpoint', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/attendee/i);
    });
  });

  describe('DELETE /events/:id/register', () => {
    it('should allow attendee to cancel registration', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      await request(app)
        .post('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      const response = await request(app)
        .delete('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/cancelled successfully/i);
      expect(response.body.data.event.participantCount).toBe(0);

      const registrations = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(registrations.body.meta.count).toBe(0);
    });

    it('should return 404 when cancelling non-existent registration', async () => {
      const organizer = await setupOrganizer();
      const attendee = await setupAttendee();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .delete('/events/1/register')
        .set('Authorization', `Bearer ${attendee.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/not registered/i);
    });

    it('should forbid organizer from cancelling registration', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .delete('/events/1/register')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
