import request from 'supertest';
import app from '../../src/server';

describe('Authentication Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Too weak
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          // Missing email and password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});
