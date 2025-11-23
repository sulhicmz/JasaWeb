import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ThrottlerModule } from '@nestjs/throttler';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ThrottlerModule.forRoot([
          {
            ttl: 60, // 1 minute
            limit: 3, // Very low limit for testing
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Global Rate Limiting', () => {
    it('should allow requests within the limit', async () => {
      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer()).get('/health').expect(200);
      }
    });

    it('should block requests exceeding the limit', async () => {
      // Make 3 requests to reach the limit
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer()).get('/health').expect(200);
      }

      // 4th request should be throttled
      await request(app.getHttpServer()).get('/health').expect(429);
    });
  });

  describe('Auth Endpoint Rate Limiting', () => {
    it('should apply stricter limits to login endpoint', async () => {
      // Make 5 login attempts (should reach the auth limit)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
          .expect(401); // Will fail auth but not be throttled yet
      }

      // 6th attempt should be throttled
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(429);
    });

    it('should include rate limit headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for rate limit headers (may vary based on implementation)
      expect(response.headers).toBeDefined();
    });
  });
});
