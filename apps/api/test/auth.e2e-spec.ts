import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      return request(server)
        .post('/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(userData.email);
          expect(res.body.user.name).toBe(userData.name);
        });
    });

    it('should return error for duplicate email', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      return request(server)
        .post('/auth/register')
        .send(userData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should return error for invalid email format', () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      return request(server)
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should return error for missing required fields', () => {
      const userData = {
        email: 'test@example.com',
        // missing password and name
      };

      return request(server)
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login user successfully', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(loginData.email);
        });
    });

    it('should return error for invalid credentials', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      return request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should return error for non-existent user', () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      return request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Get refresh token from login
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully', () => {
      return request(server)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('token');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data).toHaveProperty('expiresAt');
        });
    });

    it('should return error for missing refresh token', () => {
      return request(server)
        .post('/auth/refresh')
        .send({})
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token is required');
        });
    });

    it('should return error for invalid refresh token', () => {
      return request(server)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid refresh token');
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Get refresh token from login
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should logout user successfully', () => {
      return request(server)
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });

    it('should return error for missing refresh token', () => {
      return request(server)
        .post('/auth/logout')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token is required');
        });
    });
  });

  describe('/auth/profile (GET)', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token from login
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('should return user profile', () => {
      return request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should return error for missing authorization header', () => {
      return request(server)
        .get('/auth/profile')
        .expect(401);
    });

    it('should return error for invalid token', () => {
      return request(server)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});