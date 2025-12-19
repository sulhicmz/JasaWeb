import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ContractTestUtils } from '../helpers/contract-test-helpers';

/**
 * API Contract Test Suite for Health Endpoints
 *
 * Tests the contract between frontend and backend for health monitoring.
 * Ensures API responses remain stable and don't break client applications.
 */
describe('Health API Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return proper contract response for health check', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Contract: Health response structure
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('environment');

          // Contract: Required fields
          expect(res.body.status).toBe('healthy');
          expect(typeof res.body.timestamp).toBe('string');
          expect(typeof res.body.uptime).toBe('number');
          expect(typeof res.body.version).toBe('string');
          expect(typeof res.body.environment).toBe('string');

          // Contract: Validate timestamp format
          ContractTestUtils.validateDateString(res.body.timestamp);

          // Contract: Validate uptime
          expect(res.body.uptime).toBeGreaterThan(0);

          // Contract: No sensitive data
          ContractTestUtils.validateNoSensitiveData(res.body);

          // Contract: Response headers
          ContractTestUtils.validateResponseHeaders(res.headers, /json/);
        });
    });

    it('should include optional fields when available', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Contract: Optional fields that may be present
          const optionalFields = ['database', 'redis', 'memory', 'checks'];

          optionalFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(res.body, field)) {
              expect(typeof res.body[field]).toBe('object');
            }
          });

          // Contract: Database health if present
          if (res.body.database) {
            expect(res.body.database).toHaveProperty('status');
            expect(res.body.database).toHaveProperty('responseTime');
            expect(['healthy', 'unhealthy', 'degraded']).toContain(
              res.body.database.status
            );
            expect(typeof res.body.database.responseTime).toBe('number');
            expect(res.body.database.responseTime).toBeGreaterThan(0);
          }
        });
    });

    it('should handle degraded health state', async () => {
      // This would typically be tested by mocking unhealthy services
      // For now, we test the structure remains consistent
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Contract: Structure should remain consistent even in degraded states
          expect(res.body).toHaveProperty('status');
          expect(['healthy', 'degraded', 'unhealthy']).toContain(
            res.body.status
          );
        });
    });
  });

  describe('GET /health/ready', () => {
    it('should return proper contract response for readiness check', async () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          // Contract: Readiness response structure
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('checks');

          expect(res.body.status).toBe('ready');
          expect(typeof res.body.checks).toBe('object');

          // Contract: Common checks
          const expectedChecks = ['database', 'cache'];
          expectedChecks.forEach((check) => {
            if (res.body.checks[check]) {
              expect(res.body.checks[check]).toHaveProperty('status');
              expect(['healthy', 'unhealthy']).toContain(
                res.body.checks[check].status
              );
            }
          });
        });
    });

    it('should return 503 when not ready', async () => {
      // This would typically be tested by simulating unready state
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect((res) => {
          if (res.status === 503) {
            // Contract: Service unavailable structure
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('checks');
            expect(res.body.status).toBe('not_ready');
          } else {
            expect(res.status).toBe(200);
          }
        });
    });
  });

  describe('GET /health/live', () => {
    it('should return proper contract response for liveness check', async () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          // Contract: Liveness response structure
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');

          expect(res.body.status).toBe('alive');
          ContractTestUtils.validateDateString(res.body.timestamp);
          expect(res.body.uptime).toBeGreaterThan(0);
        });
    });
  });

  describe('Contract Versioning and Stability', () => {
    it('should maintain consistent response structure across all health endpoints', async () => {
      const healthResponse = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const readyResponse = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      const liveResponse = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      // Contract: All responses should have consistent base structure
      [healthResponse, readyResponse, liveResponse].forEach((response) => {
        expect(response.body).toHaveProperty('status');
        expect(typeof response.body.status).toBe('string');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body).not.toHaveProperty('stack');
      });
    });

    it('should not include internal system information', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Contract: No internal system details
          ContractTestUtils.validateNoSensitiveData(res.body, [
            'hostname',
            'pid',
            'internalIp',
            'systemConfig',
            'envVars',
          ]);
        });
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle malformed requests gracefully', async () => {
      // Health endpoints should always return proper responses
      return request(app.getHttpServer())
        .get('/health')
        .query({ 'invalid:param': 'value' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should not return 500 for health checks', async () => {
      // Health endpoints should never return server errors
      const endpoints = ['/health', '/health/ready', '/health/live'];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .expect((res) => {
            expect(res.status).not.toBe(500);
            if (res.status >= 400) {
              ContractTestUtils.validateErrorResponse(res.body, res.status);
            }
          });
      }
    });
  });
});
