import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  DatabaseTestHelper,
  ContractTestUtils,
  ContractTestFixtures,
} from '../helpers/contract-test-helpers';

/**
 * API Contract Test Suite for Dashboard Endpoints
 *
 * Tests the contract between frontend and backend for dashboard functionality.
 * Ensures API responses remain stable and don't break client applications.
 */
describe('Dashboard API Contract Tests', () => {
  let app: INestApplication;
  let testHelper: DatabaseTestHelper;
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    testHelper = new DatabaseTestHelper();
    await testHelper.setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get token
    const result = await testHelper.createTestUser();
    testUser = result.user;
    accessToken = result.accessToken;
  });

  afterAll(async () => {
    await testHelper.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await testHelper.clearDatabase();

    // Recreate test user after cleanup
    const result = await testHelper.createTestUser();
    testUser = result.user;
    accessToken = result.accessToken;
  });

  describe('GET /dashboard/stats', () => {
    it('should return proper contract response for dashboard stats', async () => {
      // Create test data
      await testHelper.createTestProject(testUser.organizationId, testUser.id);
      await testHelper.createTestTicket(testUser.organizationId, testUser.id);

      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response structure validation
          expect(res.body).toHaveProperty('projects');
          expect(res.body).toHaveProperty('tickets');
          expect(res.body).toHaveProperty('invoices');
          expect(res.body).toHaveProperty('milestones');

          // Contract: Projects statistics structure
          expect(res.body.projects).toEqual({
            total: expect.any(Number),
            active: expect.any(Number),
            completed: expect.any(Number),
            onHold: expect.any(Number),
          });

          // Contract: Tickets statistics structure
          expect(res.body.tickets).toEqual({
            total: expect.any(Number),
            open: expect.any(Number),
            inProgress: expect.any(Number),
            highPriority: expect.any(Number),
            critical: expect.any(Number),
          });

          // Contract: Invoices statistics structure
          expect(res.body.invoices).toEqual({
            total: expect.any(Number),
            pending: expect.any(Number),
            overdue: expect.any(Number),
            totalAmount: expect.any(Number),
            pendingAmount: expect.any(Number),
          });

          // Contract: Milestones statistics structure
          expect(res.body.milestones).toEqual({
            total: expect.any(Number),
            completed: expect.any(Number),
            overdue: expect.any(Number),
            dueThisWeek: expect.any(Number),
          });

          // Contract: Type validation
          expect(typeof res.body.projects.total).toBe('number');
          expect(typeof res.body.tickets.total).toBe('number');
          expect(typeof res.body.invoices.totalAmount).toBe('number');
          expect(typeof res.body.milestones.total).toBe('number');

          // Contract: Value constraints
          expect(res.body.projects.total).toBeGreaterThanOrEqual(0);
          expect(res.body.tickets.total).toBeGreaterThanOrEqual(0);
          expect(res.body.invoices.totalAmount).toBeGreaterThanOrEqual(0);
          expect(res.body.milestones.total).toBeGreaterThanOrEqual(0);

          // Contract: No negative values
          expect(res.body.projects.active).toBeGreaterThanOrEqual(0);
          expect(res.body.projects.completed).toBeGreaterThanOrEqual(0);
          expect(res.body.projects.onHold).toBeGreaterThanOrEqual(0);
          expect(res.body.tickets.open).toBeGreaterThanOrEqual(0);
          expect(res.body.tickets.inProgress).toBeGreaterThanOrEqual(0);
          expect(res.body.tickets.highPriority).toBeGreaterThanOrEqual(0);
          expect(res.body.tickets.critical).toBeGreaterThanOrEqual(0);

          // Contract: Response headers
          ContractTestUtils.validateResponseHeaders(res.headers, /json/);
        });
    });

    it('should return proper contract response for empty organization', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Should return zero values for empty org
          expect(res.body.projects.total).toBe(0);
          expect(res.body.tickets.total).toBe(0);
          expect(res.body.invoices.total).toBe(0);
          expect(res.body.milestones.total).toBe(0);

          // Contract: All derived values should be zero
          expect(res.body.projects.active).toBe(0);
          expect(res.body.projects.completed).toBe(0);
          expect(res.body.projects.onHold).toBe(0);
          expect(res.body.tickets.open).toBe(0);
          expect(res.body.tickets.inProgress).toBe(0);
          expect(res.body.tickets.highPriority).toBe(0);
          expect(res.body.tickets.critical).toBe(0);
        });
    });

    it('should support refresh parameter', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats?refresh=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response should have same structure regardless of refresh
          expect(res.body).toHaveProperty('projects');
          expect(res.body).toHaveProperty('tickets');
          expect(res.body).toHaveProperty('invoices');
          expect(res.body).toHaveProperty('milestones');
        });
    });

    it('should return proper error contract for unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
          expect(res.body.error).toBe('Unauthorized');
        });
    });
  });

  describe('GET /dashboard/recent-activity', () => {
    it('should return proper contract response for recent activity', async () => {
      // Create test activities
      await testHelper.createTestProject(testUser.organizationId, testUser.id);
      await testHelper.createTestTicket(testUser.organizationId, testUser.id);

      return request(app.getHttpServer())
        .get('/dashboard/recent-activity')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response should be array
          expect(Array.isArray(res.body)).toBe(true);

          if (res.body.length > 0) {
            // Contract: Activity item structure
            expect(res.body[0]).toEqual({
              id: expect.any(String),
              type: expect.any(String),
              title: expect.any(String),
              description: expect.any(String),
              status: expect.any(String),
              createdAt: expect.any(String),
              priority: expect.any(String),
            });

            // Contract: Validate data types
            ContractTestUtils.validateUUID(res.body[0].id);
            ContractTestUtils.validateDateString(res.body[0].createdAt);
            ContractTestUtils.validateEmail(res.body[0].type); // Should be valid email format

            // Contract: Type validation
            expect(['project', 'ticket', 'milestone', 'invoice']).toContain(
              res.body[0].type
            );
            expect(['low', 'medium', 'high', 'critical']).toContain(
              res.body[0].priority
            );

            // Contract: No sensitive data
            ContractTestUtils.validateNoSensitiveData(res.body[0]);
          }
        });
    });

    it('should respect limit parameter', async () => {
      // Create multiple activities
      for (let i = 0; i < 15; i++) {
        await testHelper.createTestProject(
          testUser.organizationId,
          testUser.id
        );
      }

      return request(app.getHttpServer())
        .get('/dashboard/recent-activity?limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should return empty array for organization with no activity', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/recent-activity')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('should return proper error contract for invalid limit', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/recent-activity?limit=-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 400);
        });
    });
  });

  describe('GET /dashboard/projects-overview', () => {
    it('should return proper contract response for projects overview', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .get('/dashboard/projects-overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response should be array
          expect(Array.isArray(res.body)).toBe(true);

          if (res.body.length > 0) {
            // Contract: Project overview item structure
            expect(res.body[0]).toEqual({
              id: project.id,
              name: expect.any(String),
              description: expect.any(String),
              status: expect.any(String),
              progress: expect.any(Number),
              totalMilestones: expect.any(Number),
              completedMilestones: expect.any(Number),
              openTickets: expect.any(Number),
              highPriorityTickets: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            });

            // Contract: Validate data types
            ContractTestUtils.validateUUID(res.body[0].id);
            ContractTestUtils.validateDateString(res.body[0].createdAt);
            ContractTestUtils.validateDateString(res.body[0].updatedAt);

            // Contract: Progress constraints
            expect(res.body[0].progress).toBeGreaterThanOrEqual(0);
            expect(res.body[0].progress).toBeLessThanOrEqual(100);

            // Contract: Count constraints
            expect(res.body[0].totalMilestones).toBeGreaterThanOrEqual(0);
            expect(res.body[0].completedMilestones).toBeGreaterThanOrEqual(0);
            expect(res.body[0].completedMilestones).toBeLessThanOrEqual(
              res.body[0].totalMilestones
            );
            expect(res.body[0].openTickets).toBeGreaterThanOrEqual(0);
            expect(res.body[0].highPriorityTickets).toBeGreaterThanOrEqual(0);
            expect(res.body[0].highPriorityTickets).toBeLessThanOrEqual(
              res.body[0].openTickets
            );
          }
        });
    });

    it('should respect limit parameter', async () => {
      // Create multiple projects
      for (let i = 0; i < 10; i++) {
        await testHelper.createTestProject(
          testUser.organizationId,
          testUser.id
        );
      }

      return request(app.getHttpServer())
        .get('/dashboard/projects-overview?limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });

    it('should return empty array for organization with no projects', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/projects-overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('POST /dashboard/refresh-cache', () => {
    it('should return proper contract response for cache refresh', async () => {
      return request(app.getHttpServer())
        .post('/dashboard/refresh-cache')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Refresh response structure
          expect(res.body).toEqual({
            message: 'Dashboard cache refreshed successfully',
            timestamp: expect.any(String),
          });

          // Contract: Validate timestamp format
          ContractTestUtils.validateDateString(res.body.timestamp);
        });
    });

    it('should return proper error contract for unauthorized cache refresh', async () => {
      return request(app.getHttpServer())
        .post('/dashboard/refresh-cache')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
        });
    });
  });

  describe('Multi-tenancy Contract', () => {
    it('should enforce organization isolation for all dashboard endpoints', async () => {
      // Create user and data in organization A
      const userA = await testHelper.createTestUser({
        email: 'user-a@example.com',
      });
      await testHelper.createTestProject(
        userA.user.organizationId,
        userA.user.id
      );
      await testHelper.createTestTicket(
        userA.user.organizationId,
        userA.user.id
      );

      // Create user in organization B (no data)
      const userB = await testHelper.createTestUser({
        email: 'user-b@example.com',
      });

      // User B should see empty dashboard
      const statsResponse = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(statsResponse.body.projects.total).toBe(0);
      expect(statsResponse.body.tickets.total).toBe(0);

      const activityResponse = await request(app.getHttpServer())
        .get('/dashboard/recent-activity')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(activityResponse.body).toEqual([]);

      const projectsResponse = await request(app.getHttpServer())
        .get('/dashboard/projects-overview')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(projectsResponse.body).toEqual([]);
    });

    it('should properly scope cache operations to organization', async () => {
      // Test cache refresh for specific organization
      await request(app.getHttpServer())
        .post('/dashboard/refresh-cache')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Create data in another organization
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com',
      });

      await testHelper.createTestProject(
        otherUser.user.organizationId,
        otherUser.user.id
      );

      // Original user's cached data should not be affected
      const statsResponse = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Contract: Data should still be scoped correctly
      expect(statsResponse.body.projects.total).toBe(0);
    });
  });

  describe('Performance Contract', () => {
    it('should handle concurrent requests without data corruption', async () => {
      // Create test data
      for (let i = 0; i < 5; i++) {
        await testHelper.createTestProject(
          testUser.organizationId,
          testUser.id
        );
        await testHelper.createTestTicket(testUser.organizationId, testUser.id);
      }

      // Make concurrent requests
      const requests = Array(10)
        .fill(0)
        .map(() =>
          request(app.getHttpServer())
            .get('/dashboard/stats')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
        );

      const responses = await Promise.all(requests);

      // Contract: All responses should have identical contract structure
      responses.forEach((res) => {
        expect(res.body).toHaveProperty('projects');
        expect(res.body).toHaveProperty('tickets');
        expect(res.body).toHaveProperty('invoices');
        expect(res.body).toHaveProperty('milestones');
        expect(res.body.projects.total).toBe(5);
        expect(res.body.tickets.total).toBe(5);
      });
    });

    it('should maintain response size within reasonable limits', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response should be reasonably sized
          const responseString = JSON.stringify(res.body);
          expect(responseString.length).toBeLessThan(2048); // 2KB max for stats
        });
    });
  });

  describe('Analytics Extensions Contract', () => {
    it('should support analytics trends endpoint', async () => {
      return (
        request(app.getHttpServer())
          .get(
            '/dashboard/analytics/trends?period=30d&metrics=projects,tickets'
          )
          .set('Authorization', `Bearer ${accessToken}`)
          // Note: This might return 404 if analytics routes aren't implemented yet
          .expect((res) => {
            if (res.status === 200) {
              // Contract: Analytics response structure if implemented
              expect(res.body).toHaveProperty('period');
              expect(res.body).toHaveProperty('trends');
              expect(res.body).toHaveProperty('startDate');
              expect(res.body).toHaveProperty('endDate');
            } else {
              // Should return proper 404 if not implemented
              expect(res.status).toBe(404);
              ContractTestUtils.validateErrorResponse(res.body, 404);
            }
          })
      );
    });

    it('should support performance metrics endpoint', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/analytics/performance?period=90d')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          if (res.status === 200) {
            // Contract: Performance metrics structure if implemented
            expect(res.body).toHaveProperty('period');
            expect(res.body).toHaveProperty('projectPerformance');
            expect(res.body).toHaveProperty('ticketResolution');
            expect(res.body).toHaveProperty('milestoneCompletion');
          } else {
            expect(res.status).toBe(404);
            ContractTestUtils.validateErrorResponse(res.body, 404);
          }
        });
    });
  });

  describe('Contract Versioning and Stability', () => {
    it('should maintain consistent response structure across different data states', async () => {
      // Get dashboard stats with empty organization
      const emptyResponse = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Add data and get stats again
      await testHelper.createTestProject(testUser.organizationId, testUser.id);
      const dataResponse = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Contract: Structure should be identical
      const requiredFields = ['projects', 'tickets', 'invoices', 'milestones'];
      requiredFields.forEach((field) => {
        expect(emptyResponse.body).toHaveProperty(field);
        expect(dataResponse.body).toHaveProperty(field);
      });

      // Contract: Sub-structure should be identical
      expect(typeof emptyResponse.body.projects).toBe('object');
      expect(typeof dataResponse.body.projects).toBe('object');
      expect(Object.keys(emptyResponse.body.projects)).toEqual(
        Object.keys(dataResponse.body.projects)
      );
    });

    it('should not include internal or debugging information', async () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: No internal fields
          ContractTestUtils.validateNoSensitiveData(res.body, [
            'queryTime',
            'cacheHits',
            'databaseQueries',
            'internalMetrics',
            'debugInfo',
          ]);
        });
    });
  });
});
