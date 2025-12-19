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
 * API Contract Test Suite for Files Endpoints
 *
 * Tests the contract between frontend and backend for file management.
 * Ensures API responses remain stable and don't break client applications.
 */
describe('Files API Contract Tests', () => {
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

  describe('POST /files/upload', () => {
    it('should return proper contract response for successful file upload', async () => {
      const fileContent = Buffer.from('Test file content');
      const filename = 'test-document.txt';

      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, filename)
        .field('description', 'Test file upload')
        .expect(201)
        .expect((res) => {
          // Contract: Upload response structure
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('filename');
          expect(res.body).toHaveProperty('originalName');
          expect(res.body).toHaveProperty('mimeType');
          expect(res.body).toHaveProperty('size');
          expect(res.body).toHaveProperty('url');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('uploadedBy');
          expect(res.body).toHaveProperty('organizationId');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');

          // Contract: Validate data types
          ContractTestUtils.validateUUID(res.body.id);
          expect(typeof res.body.filename).toBe('string');
          expect(typeof res.body.originalName).toBe('string');
          expect(typeof res.body.mimeType).toBe('string');
          expect(typeof res.body.size).toBe('number');
          expect(typeof res.body.url).toBe('string');
          expect(typeof res.body.description).toBe('string');
          ContractTestUtils.validateUUID(res.body.uploadedBy);
          ContractTestUtils.validateUUID(res.body.organizationId);
          ContractTestUtils.validateDateString(res.body.createdAt);
          ContractTestUtils.validateDateString(res.body.updatedAt);

          // Contract: Value validation
          expect(res.body.originalName).toBe(filename);
          expect(res.body.size).toBe(fileContent.length);
          expect(res.body.uploadedBy).toBe(testUser.id);
          expect(res.body.organizationId).toBe(testUser.organizationId);
          expect(res.body.description).toBe('Test file upload');
          expect(res.body.mimeType).toBe('text/plain');

          // Contract: URL validation
          expect(res.body.url).toMatch(/^https?:\/\//);

          // Contract: No sensitive data
          ContractTestUtils.validateNoSensitiveData(res.body);

          // Contract: Response headers
          ContractTestUtils.validateResponseHeaders(res.headers, /json/);
        });
    });

    it('should return proper error contract for missing file', async () => {
      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('description', 'Test file upload')
        .expect(400)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 400);
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.message).toContain('file');
        });
    });

    it('should return proper error contract for unauthorized upload', async () => {
      const fileContent = Buffer.from('Test content');

      return request(app.getHttpServer())
        .post('/files/upload')
        .attach('file', fileContent, 'test.txt')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
        });
    });

    it('should return proper error contract for oversized file', async () => {
      // Create a large file buffer (mock oversized file)
      const largeContent = Buffer.alloc(20 * 1024 * 1024); // 20MB

      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', largeContent, 'large-file.txt')
        .expect(413) // Payload Too Large
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 413);
        });
    });

    it('should return proper error contract for invalid file type', async () => {
      const invalidContent = Buffer.from('\x00\x01\x02\x03'); // Binary content

      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', invalidContent, 'invalid-file.xyz')
        .expect(400)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 400);
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.message).toContain('file type');
        });
    });
  });

  describe('GET /files', () => {
    beforeEach(async () => {
      // Create test file for list operations
      const fileContent = Buffer.from('Test list content');
      await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'list-test.txt')
        .field('description', 'Test file for listing');
    });

    it('should return proper contract response for files list', async () => {
      return request(app.getHttpServer())
        .get('/files')
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

          if (res.body.data.length > 0) {
            // Contract: File list item structure
            expect(res.body.data[0]).toEqual({
              id: expect.any(String),
              filename: expect.any(String),
              originalName: expect.any(String),
              mimeType: expect.any(String),
              size: expect.any(Number),
              url: expect.any(String),
              description: expect.any(String),
              uploadedBy: expect.any(String),
              organizationId: testUser.organizationId,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            });

            // Contract: Validate data types
            ContractTestUtils.validateUUID(res.body.data[0].id);
            ContractTestUtils.validateDateString(res.body.data[0].createdAt);
            expect(typeof res.body.data[0].size).toBe('number');
            expect(res.body.data[0].size).toBeGreaterThan(0);

            // Contract: No sensitive data
            ContractTestUtils.validateNoSensitiveData(res.body.data[0]);
          }
        });
    });

    it('should return proper contract with pagination', async () => {
      return request(app.getHttpServer())
        .get('/files?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should return proper contract for empty files list', async () => {
      await testHelper.clearDatabase();
      const result = await testHelper.createTestUser();
      accessToken = result.accessToken;

      return request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.meta.total).toBe(0);
        });
    });

    it('should return proper error contract for unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/files')
        .expect(401)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 401);
        });
    });
  });

  describe('GET /files/:id', () => {
    let fileId: string;

    beforeEach(async () => {
      // Create test file
      const fileContent = Buffer.from('Test get content');
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'get-test.txt')
        .field('description', 'Test file for GET');

      fileId = response.body.id;
    });

    it('should return proper contract response for existing file', async () => {
      return request(app.getHttpServer())
        .get(`/files/${fileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: File response structure
          expect(res.body).toEqual({
            id: fileId,
            filename: expect.any(String),
            originalName: expect.any(String),
            mimeType: expect.any(String),
            size: expect.any(Number),
            url: expect.any(String),
            description: expect.any(String),
            uploadedBy: testUser.id,
            organizationId: testUser.organizationId,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          // Contract: Validate data types
          ContractTestUtils.validateUUID(res.body.id);
          ContractTestUtils.validateDateString(res.body.createdAt);
          expect(res.body.uploadedBy).toBe(testUser.id);
          expect(res.body.organizationId).toBe(testUser.organizationId);
        });
    });

    it('should return proper error contract for non-existent file', async () => {
      const nonExistentId = 'non-existent-file-id';

      return request(app.getHttpServer())
        .get(`/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
          expect(res.body.error).toBe('Not Found');
          expect(res.body.message).toContain('File not found');
        });
    });

    it('should return proper error contract for unauthorized file access', async () => {
      // Create user from different organization
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com',
      });

      return request(app.getHttpServer())
        .get(`/files/${fileId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404) // Return 404 to avoid revealing existence
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });
  });

  describe('GET /files/:id/download', () => {
    let fileId: string;
    let fileContent: Buffer;

    beforeEach(async () => {
      fileContent = Buffer.from('Test download content');
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'download-test.txt')
        .field('description', 'Test file for download');

      fileId = response.body.id;
    });

    it('should return proper contract response for file download', async () => {
      return request(app.getHttpServer())
        .get(`/files/${fileId}/download`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Download response headers
          expect(res.headers['content-type']).toBe('text/plain');
          expect(res.headers['content-disposition']).toContain('attachment');
          expect(res.headers['content-length']).toBe(
            String(fileContent.length)
          );

          // Contract: File content should match original
          expect(Buffer.compare(res.body, fileContent)).toBe(0);
        });
    });

    it('should return proper error contract for non-existent file download', async () => {
      const nonExistentId = 'non-existent-file-id';

      return request(app.getHttpServer())
        .get(`/files/${nonExistentId}/download`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });

    it('should generate signed URL for secure download', async () => {
      return request(app.getHttpServer())
        .get(`/files/${fileId}/download?signed=true`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          if (res.status === 200) {
            // Contract: Signed URL response
            expect(res.body).toHaveProperty('signedUrl');
            expect(res.body).toHaveProperty('expiresIn');
            expect(typeof res.body.signedUrl).toBe('string');
            expect(typeof res.body.expiresIn).toBe('number');
            expect(res.body.expiresIn).toBeGreaterThan(0);
            expect(res.body.expiresIn).toBeLessThanOrEqual(3600); // Max 1 hour
          } else {
            // Should return actual file content if signed URLs not implemented
            expect(res.headers['content-type']).toBe('text/plain');
          }
        });
    });
  });

  describe('DELETE /files/:id', () => {
    let fileId: string;

    beforeEach(async () => {
      const fileContent = Buffer.from('Test delete content');
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'delete-test.txt')
        .field('description', 'Test file for deletion');

      fileId = response.body.id;
    });

    it('should return proper contract response on successful file deletion', async () => {
      return request(app.getHttpServer())
        .delete(`/files/${fileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // Contract: Delete response structure
          expect(res.body).toEqual({
            message: 'File deleted successfully',
          });

          // Contract: Verify file no longer exists
          return request(app.getHttpServer())
            .get(`/files/${fileId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        });
    });

    it('should return proper error contract for non-existent file deletion', async () => {
      return request(app.getHttpServer())
        .delete('/files/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });

    it('should return proper error contract for unauthorized file deletion', async () => {
      const otherUser = await testHelper.createTestUser({
        email: 'other@example.com',
      });

      return request(app.getHttpServer())
        .delete(`/files/${fileId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404) // Return 404 to avoid revealing existence
        .expect((res) => {
          ContractTestUtils.validateErrorResponse(res.body, 404);
        });
    });
  });

  describe('Multi-tenancy Contract', () => {
    it('should enforce organization isolation for all file operations', async () => {
      // Create user and file in organization A
      const userA = await testHelper.createTestUser({
        email: 'user-a@example.com',
      });

      const fileContent = Buffer.from('Organization A file');
      const fileResponse = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .attach('file', fileContent, 'org-a-file.txt')
        .field('description', 'File from org A');

      // Create user in organization B
      const userB = await testHelper.createTestUser({
        email: 'user-b@example.com',
      });

      // User B should not see User A's files
      const listResponse = await request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(listResponse.body.data).toEqual([]);
      expect(listResponse.body.meta.total).toBe(0);

      // User B should not access User A's file by ID
      return request(app.getHttpServer())
        .get(`/files/${fileResponse.body.id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(404);
    });
  });

  describe('Contract Versioning and Stability', () => {
    it('should maintain consistent response structure across file operations', async () => {
      const fileContent = Buffer.from('Consistency test content');

      // Upload file
      const uploadResponse = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'consistency-test.txt')
        .field('description', 'Consistency test file')
        .expect(201);

      // Get file details
      const getResponse = await request(app.getHttpServer())
        .get(`/files/${uploadResponse.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Get files list
      const listResponse = await request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Contract: Consistent structure across operations
      const requiredFields = [
        'id',
        'filename',
        'originalName',
        'mimeType',
        'size',
        'url',
        'description',
        'uploadedBy',
        'organizationId',
        'createdAt',
        'updatedAt',
      ];

      requiredFields.forEach((field) => {
        expect(uploadResponse.body).toHaveProperty(field);
        expect(getResponse.body).toHaveProperty(field);
        if (listResponse.body.data.length > 0) {
          expect(listResponse.body.data[0]).toHaveProperty(field);
        }
      });

      // Contract: Values should be consistent
      expect(uploadResponse.body.id).toBe(getResponse.body.id);
      expect(uploadResponse.body.filename).toBe(getResponse.body.filename);
      expect(uploadResponse.body.size).toBe(getResponse.body.size);
    });

    it('should not include internal file storage information', async () => {
      const fileContent = Buffer.from('Security test content');

      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileContent, 'security-test.txt')
        .field('description', 'Security test file')
        .expect(201)
        .expect((res) => {
          // Contract: No internal storage fields
          ContractTestUtils.validateNoSensitiveData(res.body, [
            'storagePath',
            'internalUrl',
            'bucketLocation',
            'storageProvider',
            'accessKey',
          ]);
        });
    });
  });
});
