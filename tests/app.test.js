const {
  request,
  app,
  resetTestStore,
} = require('./helpers');

beforeEach(() => {
  resetTestStore();
});

describe('App & Health', () => {
  describe('GET /health', () => {
    it('should return 200 with success message', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/running/i);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/does not exist/i);
    });

    it('should return 404 for unsupported methods on valid paths', async () => {
      const response = await request(app).patch('/health');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Invalid JSON body', () => {
    it('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid json/i);
    });
  });
});
