import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  DatabaseTestHelper,
  ContractTestUtils,
  ContractTestFixtures,
} from '@jasaweb/testing';

/**
 * API Contract Test Suite for Projects Endpoints
 *
 * Tests the contract between frontend and backend for project management.
 * Ensures API responses remain stable and don't break client applications.
 */
describe('Projects API Contract Tests', () => {
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

  describe('GET /projects (summary view)', () => {
    it('should return proper contract response for projects list', async () => {
      // Create test projects
      await testHelper.createTestProject(testUser.organizationId, testUser.id);
      await testHelper.createTestProject(testUser.organizationId, testUser.id);

      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Response structure validation
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');

          // Contract: Data should be array
          expect(Array.isArray(res.body.data)).toBe(true);

          // Contract: Meta pagination structure
          expect(res.body.meta).toEqual({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrevious: expect.any(Boolean),
          });

          // Contract: Validate pagination values
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10); // Default limit
          expect(res.body.meta.total).toBe(2);
          expect(res.body.meta.totalPages).toBe(1);
          expect(res.body.meta.hasNext).toBe(false);
          expect(res.body.meta.hasPrevious).toBe(false);

          if (res.body.data.length > 0) {
            // Contract: Project summary structure
            expect(res.body.data[0]).toEqual({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              status: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              organizationId: testUser.organizationId,
            });

            // Contract: Validate data types
            ContractTestUtils.validateDateString(res.body.data[0].createdAt);
            ContractTestUtils.validateDateString(res.body.data[0].updatedAt);
            ContractTestUtils.validateUUID(res.body.data[0].id);
            ContractTestUtils.validateUUID(res.body.data[0].organizationId);

            // Contract: Status should be valid
            expect(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).toContain(
              res.body.data[0].status
            );

            // Contract: No sensitive data
            ContractTestUtils.validateNoSensitiveData(res.body.data[0]);
          }

          // Contract: Response headers
          ContractTestUtils.validateResponseHeaders(res.headers, /json/);
        });
    });

    it('should return proper contract response for empty projects list', async () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.meta.total).toBe(0);
          expect(res.body.meta.totalPages).toBe(0);
        });
    });

    it('should return proper contract with pagination parameters', async () => {
      // Create multiple projects for pagination testing
      for (let i = 0; i < 15; i++) {
        await testHelper.createTestProject(
          testUser.organizationId,
          testUser.id
        );
      }

      return request(app.getHttpServer())
        .get('/projects?page=2&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');

          expect(res.body.meta.page).toBe(2);
          expect(res.body.meta.limit).toBe(5);
          expect(res.body.meta.total).toBe(15);
          expect(res.body.meta.totalPages).toBe(3);
          expect(res.body.meta.hasNext).toBe(true);
          expect(res.body.meta.hasPrevious).toBe(true);
          expect(res.body.data).toHaveLength(5);
        });
    });

    it('should return proper error contract for unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/projects')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
          expect(res.body.error).toBe('Unauthorized');
        });
    });

    it('should return proper error contract for invalid token', async () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
          expect(res.body.error).toBe('Unauthorized');
        });
    });
  });

  describe('GET /projects?view=detail', () => {
    it('should return proper contract response for detailed projects list', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .get('/projects?view=detail')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');

          if (res.body.data.length > 0) {
            // Contract: Detailed project structure
            expect(res.body.data[0]).toEqual({
              id: project.id,
              name: expect.any(String),
              description: expect.any(String),
              status: expect.any(String),
              organizationId: testUser.organizationId,
              createdBy: testUser.id,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              // Include counts and relations for detailed view
              milestonesCount: expect.any(Number),
              ticketsCount: expect.any(Number),
              completedMilestonesCount: expect.any(Number),
              openTicketsCount: expect.any(Number),
            });

            // Contract: Validate count fields are numbers
            expect(typeof res.body.data[0].milestonesCount).toBe('number');
            expect(typeof res.body.data[0].ticketsCount).toBe('number');
            expect(typeof res.body.data[0].completedMilestonesCount).toBe(
              'number'
            );
            expect(typeof res.body.data[0].openTicketsCount).toBe('number');
          }
        });
    });

    it('should return proper contract response with filter parameters', async () => {
      await testHelper.createTestProject(testUser.organizationId, testUser.id);
      await testHelper.createTestProject(testUser.organizationId, testUser.id);

      return request(app.getHttpServer())
        .get('/projects?view=detail&status=ACTIVE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Filtered response structure
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');

          // All returned projects should have the specified status
          if (res.body.data.length > 0) {
            res.body.data.forEach((project: any) => {
              expect(project.status).toBe('ACTIVE');
            });
          }
        });
    });
  });

  describe('POST /projects', () => {
    it('should return proper contract response on successful project creation', async () => {
      const projectData = ContractTestFixtures.createProjectData();

      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData)
        .expect(201)
        .expect((res) => {
          // Contract: Create response structure
          expect(res.body).toEqual({
            id: expect.any(String),
            name: projectData.name,
            description: projectData.description,
            status: 'ACTIVE', // Default status
            organizationId: testUser.organizationId,
            createdBy: testUser.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          // Contract: Validate data types
          ContractTestUtils.validateUUID(res.body.id);
          ContractTestUtils.validateDateString(res.body.createdAt);
          ContractTestUtils.validateDateString(res.body.updatedAt);

          // Contract: Validate no sensitive data
          ContractTestUtils.validateNoSensitiveData(res.body);

          // Contract: Response headers
          ContractTestUtils.validateResponseHeaders(res.headers, /json/);
        });
    });

    it('should return proper error contract for invalid project data', async () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '', // Empty name should fail validation
          description: 'Valid description',
        })
        .expect(400)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 400);
          expect(res.body.error).toBe('Bad Request');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should return proper error contract for missing authorization', async () => {
      const projectData = ContractTestFixtures.createProjectData();

      return request(app.getHttpServer())
        .post('/projects')
        .send(projectData)
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
        });
    });

    it('should return proper contract response with custom project data', async () => {
      const customProjectData = ContractTestFixtures.createProjectData({
        name: 'Custom Project Name',
        description: 'Custom project description for contract testing',
        status: 'ON_HOLD', // Override default status
      });

      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(customProjectData)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(customProjectData.name);
          expect(res.body.description).toBe(customProjectData.description);
          expect(res.body.status).toBe(customProjectData.status);
        });
    });
  });

  describe('GET /projects/:id', () => {
    it('should return proper contract response for existing project', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Single project response structure
          expect(res.body).toEqual({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            organizationId: testUser.organizationId,
            createdBy: testUser.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          // Contract: Validate UUID and timestamp formats
          ContractTestUtils.validateUUID(res.body.id);
          ContractTestUtils.validateDateString(res.body.createdAt);
          ContractTestUtils.validateDateString(res.body.updatedAt);
        });
    });

    it('should return proper error contract for non-existent project', async () => {
      const nonExistentId = 'non-existent-id';

      return request(app.getHttpServer())
        .get(`/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
          expect(res.body.error).toBe('Not Found');
          expect(res.body.message).toContain('Project not found');
        });
    });

    it('should return proper error contract for unauthorized project access', async () => {
      // Create user from different organization
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com',
      });

      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 403);
          expect(res.body.error).toBe('Forbidden');
        });
    });
  });

  describe('PUT /projects/:id', () => {
    it('should return proper contract response on successful project update', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated project description',
        status: 'COMPLETED',
      };

      return request(app.getHttpServer())
        .put(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          // Contract: Update response structure
          expect(res.body).toEqual({
            id: project.id,
            name: updateData.name,
            description: updateData.description,
            status: updateData.status,
            organizationId: testUser.organizationId,
            createdBy: testUser.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          // Contract: Verify updated fields
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.description).toBe(updateData.description);
          expect(res.body.status).toBe(updateData.status);

          // Contract: Updated timestamp should be recent
          const updatedAt = new Date(res.body.updatedAt);
          const createdAt = new Date(res.body.createdAt);
          expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
            createdAt.getTime()
          );
        });
    });

    it('should return proper error contract for invalid project data', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .put(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '', // Invalid empty name
        })
        .expect(400)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 400);
        });
    });

    it('should return proper error contract for non-existent project', async () => {
      return request(app.getHttpServer())
        .put('/projects/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should return proper contract response on successful project deletion', async () => {
      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Delete response structure
          expect(res.body).toEqual({
            message: 'Project deleted successfully',
          });

          // Contract: Verify project no longer exists
          request(app.getHttpServer())
            .get(`/projects/${project.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        });
    });

    it('should return proper error contract for non-existent project', async () => {
      return request(app.getHttpServer())
        .delete('/projects/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });

    it('should return proper error contract for unauthorized project deletion', async () => {
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com',
      });

      const project = await testHelper.createTestProject(
        testUser.organizationId,
        testUser.id
      );

      return request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 403);
        });
    });
  });

  describe('Multi-tenancy Contract', () => {
    it('should enforce organization isolation', async () => {
      // Create user and project in organization A
      const userA = await testHelper.createTestUser({
        email: 'user-a@example.com',
      });
      const projectA = await testHelper.createTestProject(
        userA.user.organizationId,
        userA.user.id
      );

      // Create user in organization B
      const userB = await testHelper.createTestUser({
        email: 'user-b@example.com',
      });

      // User B should not see User A's projects
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.meta.total).toBe(0);
        });
    });

    it('should properly scope operations to user organization', async () => {
      const userA = await testHelper.createTestUser({
        email: 'user-a@example.com',
      });
      const projectA = await testHelper.createTestProject(
        userA.user.organizationId,
        userA.user.id
      );

      // User B should not be able to access User A's project by ID
      const userB = await testHelper.createTestUser({
        email: 'user-b@example.com',
      });

      return request(app.getHttpServer())
        .get(`/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(404); // Should return 404, not 403, to avoid revealing existence
    });
  });

  describe('Contract Versioning and Stability', () => {
    it('should maintain consistent response structure across operations', async () => {
      const projectData = ContractTestFixtures.createProjectData();

      // Create project
      const createResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData)
        .expect(201);

      // Get project
      const getResponse = await request(app.getHttpServer())
        .get(`/projects/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Contract: Create and get responses should have same structure
      const requiredFields = [
        'id',
        'name',
        'description',
        'status',
        'organizationId',
        'createdBy',
        'createdAt',
        'updatedAt',
      ];
      requiredFields.forEach((field) => {
        expect(createResponse.body).toHaveProperty(field);
        expect(getResponse.body).toHaveProperty(field);
      });

      // Contract: Values should be consistent
      expect(createResponse.body.id).toBe(getResponse.body.id);
      expect(createResponse.body.name).toBe(getResponse.body.name);
      expect(createResponse.body.description).toBe(
        getResponse.body.description
      );
    });

    it('should not include internal or sensitive information', async () => {
      const projectData = ContractTestFixtures.createProjectData();

      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData)
        .expect(201)
        .expect((res) => {
          // Contract: No sensitive or internal fields
          ContractTestUtils.validateNoSensitiveData(res.body, [
            'internalStatus',
            'adminNotes',
            'databaseId',
            'systemFields',
          ]);
        });
    });
  });
});
