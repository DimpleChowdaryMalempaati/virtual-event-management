const {
  request,
  app,
  organizerPayload,
  organizer2Payload,
  attendeePayload,
  validEvent,
  setupOrganizer,
  setupAttendee,
  createEventAs,
  registerUser,
  resetTestStore,
} = require('./helpers');

beforeEach(() => {
  resetTestStore();
});

describe('Events API', () => {
  describe('GET /events', () => {
    it('should return empty list when no events exist', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/no events found/i);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.count).toBe(0);
    });

    it('should return all events with organizer names', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken, validEvent({ title: 'Event One' }));
      await createEventAs(organizer.accessToken, validEvent({ title: 'Event Two' }));

      const response = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/retrieved successfully/i);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.count).toBe(2);
      expect(response.body.data[0].organizerName).toBe(organizerPayload.name);
      expect(response.body.data[0].participantCount).toBe(0);
    });
  });

  describe('GET /events/:id', () => {
    it('should return a single event by ID', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .get('/events/1')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.title).toBe('Tech Meetup');
      expect(response.body.data.organizerId).toBe(organizer.user.id);
    });

    it('should return 404 for non-existent event', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .get('/events/999')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid event ID', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .get('/events/abc')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /events', () => {
    it('should allow organizer to create an event', async () => {
      const organizer = await setupOrganizer();

      const response = await createEventAs(organizer.accessToken);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/created successfully/i);
      expect(response.body.data).toMatchObject({
        id: 1,
        title: 'Tech Meetup',
        date: '2026-08-15',
        time: '14:00',
        organizerId: organizer.user.id,
        participantCount: 0,
      });
      expect(response.body.data.participants).toEqual([]);
    });

    it('should reject attendee from creating events', async () => {
      const attendee = await setupAttendee();

      const response = await createEventAs(attendee.accessToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/organizer/i);
    });

    it('should reject invalid event data', async () => {
      const organizer = await setupOrganizer();

      const response = await createEventAs(organizer.accessToken, {
        title: '',
        date: 'bad-date',
        time: '99:99',
        description: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /events/:id', () => {
    it('should allow organizer to update their own event', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .put('/events/1')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send({ title: 'Updated Meetup' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/updated successfully/i);
      expect(response.body.data.title).toBe('Updated Meetup');
    });

    it('should reject update with no fields provided', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const response = await request(app)
        .put('/events/1')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should forbid organizer from updating another organizer event', async () => {
      const organizer1 = await setupOrganizer();
      await createEventAs(organizer1.accessToken);

      const organizer2 = await setupOrganizer(organizer2Payload);

      const response = await request(app)
        .put('/events/1')
        .set('Authorization', `Bearer ${organizer2.accessToken}`)
        .send({ title: 'Hijacked Event' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/you created/i);
    });

    it('should return 404 when updating non-existent event', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .put('/events/999')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send({ title: 'Ghost Event' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should allow organizer to delete their own event', async () => {
      const organizer = await setupOrganizer();
      await createEventAs(organizer.accessToken);

      const deleteResponse = await request(app)
        .delete('/events/1')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toMatch(/deleted successfully/i);

      const getResponse = await request(app)
        .get('/events/1')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should forbid organizer from deleting another organizer event', async () => {
      const organizer1 = await setupOrganizer();
      await createEventAs(organizer1.accessToken);

      const organizer2 = await setupOrganizer(organizer2Payload);

      const response = await request(app)
        .delete('/events/1')
        .set('Authorization', `Bearer ${organizer2.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when deleting non-existent event', async () => {
      const organizer = await setupOrganizer();

      const response = await request(app)
        .delete('/events/999')
        .set('Authorization', `Bearer ${organizer.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
