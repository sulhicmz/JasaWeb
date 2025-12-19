import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseTestHelper } from '../helpers/test-helpers';

/**
 * API Contract Test Suite for Authentication Endpoints
 *
 * This suite tests the contract between frontend and backend API.
 * It ensures API responses remain stable and don't break clients.
 *
 * Contract tests focus on:
 * - Response structure and data types
 * - Status codes for different scenarios
 * - Error response format
 * - HTTP headers and metadata
 */
describe('Authentication API Contract Tests', () => {
  let app: INestApplication;
  let testHelper: DatabaseTestHelper;

  beforeAll(async () => {
    testHelper = new DatabaseTestHelper();
    await testHelper.setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await testHelper.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await testHelper.clearDatabase();
  });

  describe('POST /auth/register', () => {
    const validPayload = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      organizationName: 'Test Organization',
    };

    it('should return proper contract response on successful registration', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(201)
        .expect((res) => {
          // Contract: Response structure validation
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('tokens');
          expect(res.body).toHaveProperty('message');

          // Contract: User object structure
          expect(res.body.user).toEqual({
            id: expect.any(String),
            email: validPayload.email,
            firstName: validPayload.firstName,
            lastName: validPayload.lastName,
            organizationId: expect.any(String),
            organization: {
              id: expect.any(String),
              name: validPayload.organizationName,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            role: 'OWNER',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            password: undefined, // Should not return password
          });

          // Contract: Tokens object structure
          expect(res.body.tokens).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          });

          // Contract: Message format
          expect(res.body.message).toBe('User registered successfully');

          // Contract: Response headers
          expect(res.headers['content-type']).toMatch(/json/);
        });
    });

    it('should return proper error contract for invalid email', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validPayload,
          email: 'invalid-email',
        })
        .expect(400)
        .expect((res) => {
          // Contract: Error response structure
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('timestamp');

          // Contract: Error data types
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('email');
          expect(res.body.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          );
        });
    });

    it('should return proper error contract for weak password', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validPayload,
          password: '123',
        })
        .expect(400)
        .expect((res) => {
          // Contract: Validation error format
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.statusCode).toBe(400);
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(
            res.body.message.some((msg: string) => msg.includes('password'))
          ).toBe(true);
        });
    });

    it('should return proper error contract for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(201);

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validPayload)
        .expect(409)
        .expect((res) => {
          // Contract: Conflict error format
          expect(res.body.error).toBe('Conflict');
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toContain('email');
          expect(res.body.message).toContain('already exists');
        });
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      email: 'login@example.com',
      password: 'SecurePass123!',
      firstName: 'Login',
      lastName: 'User',
      organizationName: 'Login Test Org',
    };

    beforeEach(async () => {
      // Register user first
      await request(app.getHttpServer()).post('/auth/register').send(userData);
    });

    it('should return proper contract response on successful login', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200)
        .expect((res) => {
          // Contract: Login response structure
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('tokens');

          // Contract: User object (should match register response but without org details)
          expect(res.body.user).toEqual({
            id: expect.any(String),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            organizationId: expect.any(String),
            organization: {
              id: expect.any(String),
              name: userData.organizationName,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            role: 'OWNER',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            password: undefined,
          });

          // Contract: Tokens object (should match register tokens structure)
          expect(res.body.tokens).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          });

          // Contract: Token format validation
          expect(res.body.tokens.accessToken).toMatch(
            /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
          );
          expect(res.body.tokens.refreshToken).toMatch(
            /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
          );
          expect(res.body.tokens.expiresIn).toBeGreaterThan(0);
        });
    });

    it('should return proper error contract for invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrong-password',
        })
        .expect(401)
        .expect((res) => {
          // Contract: Auth error format
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBe(' Invalid credentials');
        });
    });

    it('should return proper error contract for non-existent user', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401)
        .expect((res) => {
          // Contract: Should not reveal user existence
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBe(' Invalid credentials');
        });
    });
  });

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePass123!',
          firstName: 'Refresh',
          lastName: 'User',
          organizationName: 'Refresh Test Org',
        });

      validRefreshToken = registerResponse.body.tokens.refreshToken;
    });

    it('should return proper contract response on successful refresh', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200)
        .expect((res) => {
          // Contract: Refresh response structure
          expect(res.body).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          });

          // Contract: Token formats
          expect(res.body.accessToken).toMatch(
            /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
          );
          expect(res.body.refreshToken).toMatch(
            /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
          );
          expect(res.body.expiresIn).toBeGreaterThan(0);

          // Contract: Should get new tokens (not the same as before)
          expect(res.body.accessToken).not.toBe(validRefreshToken);
          expect(res.body.refreshToken).not.toBe(validRefreshToken);
        });
    });

    it('should return proper error contract for invalid refresh token', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)
        .expect((res) => {
          // Contract: Token error format
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBe('Invalid refresh token');
        });
    });

    it('should return proper error contract for missing refresh token', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400)
        .expect((res) => {
          // Contract: Validation error
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('refreshToken');
        });
    });
  });

  describe('POST /auth/logout', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
          firstName: 'Logout',
          lastName: 'User',
          organizationName: 'Logout Test Org',
        });

      validAccessToken = registerResponse.body.tokens.accessToken;
    });

    it('should return proper contract response on successful logout', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Logout response structure
          expect(res.body).toEqual({
            message: 'Logged out successfully',
          });
        });
    });

    it('should return proper error contract for missing authorization', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401)
        .expect((res) => {
          // Contract: Missing auth error
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('should return proper error contract for invalid token', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          // Contract: Invalid token error
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
        });
    });
  });

  describe('GET /auth/profile', () => {
    let validAccessToken: string;
    let userData: any;

    beforeEach(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'SecurePass123!',
          firstName: 'Profile',
          lastName: 'User',
          organizationName: 'Profile Test Org',
        });

      validAccessToken = registerResponse.body.tokens.accessToken;
      userData = registerResponse.body.user;
    });

    it('should return proper contract response for profile retrieval', async () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Profile response should match user structure
          expect(res.body).toEqual({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            organizationId: userData.organizationId,
            organization: userData.organization,
            role: 'OWNER',
            isActive: true,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            password: undefined, // Never include password
          });
        });
    });

    it('should return proper error contract for unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401)
        .expect((res) => {
          // Contract: Unauthorized error format
          expect(res.body.error).toBe('Unauthorized');
          expect(res.body.statusCode).toBe(401);
        });
    });
  });

  describe('Contract Versioning and Backward Compatibility', () => {
    it('should maintain response structure version consistency', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'version@example.com',
          password: 'SecurePass123!',
          firstName: 'Version',
          lastName: 'Test',
          organizationName: 'Version Test Org',
        })
        .expect(201);

      // Contract: Ensure response has all required fields
      const requiredFields = ['user', 'tokens', 'message'];
      requiredFields.forEach((field) => {
        expect(response.body).toHaveProperty(field);
      });

      // Contract: Ensure nested objects have required structure
      const userFields = [
        'id',
        'email',
        'firstName',
        'lastName',
        'organizationId',
        'organization',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ];
      userFields.forEach((field) => {
        expect(response.body.user).toHaveProperty(field);
      });

      const tokenFields = ['accessToken', 'refreshToken', 'expiresIn'];
      tokenFields.forEach((field) => {
        expect(response.body.tokens).toHaveProperty(field);
      });
    });

    it('should not include sensitive information in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'sensitive@example.com',
          password: 'SecurePass123!',
          firstName: 'Sensitive',
          lastName: 'Test',
          organizationName: 'Sensitive Test Org',
        })
        .expect(201);

      // Contract: Security - ensure no sensitive data leaks
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('salt');
      expect(response.body.tokens).not.toHaveProperty('tokenType');
      expect(response.body).not.toHaveProperty('internalData');
    });
  });
});
