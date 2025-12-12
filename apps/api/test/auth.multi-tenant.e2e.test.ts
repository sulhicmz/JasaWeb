import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Multi-tenant Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  describe('Multi-tenant Login Flow', () => {
    let organization1: any;
    let organization2: any;
    let user1: any;
    let user2: any;

    beforeEach(async () => {
      // Create two organizations
      organization1 = await prisma.organization.create({
        data: {
          name: 'Organization 1',
          billingEmail: 'org1@example.com',
          plan: 'premium',
        },
      });

      organization2 = await prisma.organization.create({
        data: {
          name: 'Organization 2',
          billingEmail: 'org2@example.com',
          plan: 'basic',
        },
      });

      // Create users for each organization
      const hashedPassword1 = await bcrypt.hash('password123', 10);
      const hashedPassword2 = await bcrypt.hash('password456', 10);

      user1 = await prisma.user.create({
        data: {
          email: 'user1@org1.com',
          name: 'User 1',
          password: hashedPassword1,
        },
      });

      user2 = await prisma.user.create({
        data: {
          email: 'user2@org2.com',
          name: 'User 2',
          password: hashedPassword2,
        },
      });

      // Create memberships
      await prisma.membership.create({
        data: {
          userId: user1.id,
          organizationId: organization1.id,
          role: 'owner',
        },
      });

      await prisma.membership.create({
        data: {
          userId: user2.id,
          organizationId: organization2.id,
          role: 'admin',
        },
      });
    });

    it('should login user1 and return correct organization context', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user1@org1.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user.email).toBe('user1@org1.com');
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Now test accessing a protected endpoint
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(200);

      // The profile should include organization context
      expect(profileResponse.body).toHaveProperty('organizationId');
      expect(profileResponse.body.organizationId).toBe(organization1.id);
    });

    it('should login user2 and return correct organization context', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user2@org2.com',
          password: 'password456',
        })
        .expect(200);

      expect(response.body.user.email).toBe('user2@org2.com');
      expect(response.body.access_token).toBeDefined();

      // Test accessing protected endpoint
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${response.body.access_token}`)
        .expect(200);

      expect(profileResponse.body.organizationId).toBe(organization2.id);
    });

    it('should prevent cross-organization data access', async () => {
      // Login as user1 (org1)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user1@org1.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Create a project in organization 1
      const project1 = await prisma.project.create({
        data: {
          name: 'Project 1',
          organizationId: organization1.id,
          status: 'draft',
        },
      });

      // Create a project in organization 2
      const project2 = await prisma.project.create({
        data: {
          name: 'Project 2',
          organizationId: organization2.id,
          status: 'draft',
        },
      });

      // Try to access projects - should only return projects from user's organization
      const projectsResponse = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should only return projects from organization 1
      expect(projectsResponse.body).toHaveProperty('data');
      if (Array.isArray(projectsResponse.body.data)) {
        projectsResponse.body.data.forEach((project: any) => {
          expect(project.organizationId).toBe(organization1.id);
        });
      }
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user1@org1.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should handle token refresh with organization context', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user1@org1.com',
          password: 'password123',
        })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data.access_token).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();

      // Test that new token still has organization context
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(
          'Authorization',
          `Bearer ${refreshResponse.body.data.access_token}`
        )
        .expect(200);

      expect(profileResponse.body.organizationId).toBe(organization1.id);
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    it('should enforce organization isolation in project endpoints', async () => {
      // Create organization and user
      const org = await prisma.organization.create({
        data: {
          name: 'Test Org',
          billingEmail: 'test@example.com',
        },
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
        },
      });

      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'owner',
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Create project in the organization
      const project = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Project',
          status: 'draft',
        })
        .expect(201);

      expect(project.body.organizationId).toBe(org.id);

      // Retrieve projects - should only return org's projects
      const projectsResponse = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(projectsResponse.body.data).toHaveLength(1);
      expect(projectsResponse.body.data[0].organizationId).toBe(org.id);
    });
  });
});
