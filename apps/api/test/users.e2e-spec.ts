import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    // Login to get auth token
    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user successfully', () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      return request(server)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(userData.email);
          expect(res.body.name).toBe(userData.name);
        });
    });

    it('should return error for unauthorized request', () => {
      const userData = {
        email: 'unauthorized@example.com',
        password: 'password123',
        name: 'Unauthorized User',
      };

      return request(server)
        .post('/users')
        .send(userData)
        .expect(401);
    });

    it('should return error for invalid data', () => {
      const userData = {
        email: 'invalid-email',
        // missing password and name
      };

      return request(server)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return list of users', () => {
      return request(server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('email');
            expect(res.body[0]).toHaveProperty('name');
          }
        });
    });

    it('should return error for unauthorized request', () => {
      return request(server)
        .get('/users')
        .expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    let userId: string;

    beforeAll(async () => {
      // Get a user ID from the users list
      const usersResponse = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      if (usersResponse.body.length > 0) {
        userId = usersResponse.body[0].id;
      }
    });

    it('should return a single user', () => {
      if (!userId) return; // Skip if no users exist

      return request(server)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
        });
    });

    it('should return error for non-existent user', () => {
      return request(server)
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return error for unauthorized request', () => {
      if (!userId) return; // Skip if no users exist

      return request(server)
        .get(`/users/${userId}`)
        .expect(401);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let userId: string;

    beforeAll(async () => {
      // Get a user ID from the users list
      const usersResponse = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      if (usersResponse.body.length > 0) {
        userId = usersResponse.body[0].id;
      }
    });

    it('should update a user successfully', () => {
      if (!userId) return; // Skip if no users exist

      const updateData = {
        name: 'Updated Name',
      };

      return request(server)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
        });
    });

    it('should return error for non-existent user', () => {
      const updateData = {
        name: 'Updated Name',
      };

      return request(server)
        .patch('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return error for unauthorized request', () => {
      if (!userId) return; // Skip if no users exist

      const updateData = {
        name: 'Updated Name',
      };

      return request(server)
        .patch(`/users/${userId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: string;

    beforeAll(async () => {
      // Create a user to delete
      const createResponse = await request(server)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'deletable@example.com',
          password: 'password123',
          name: 'Deletable User',
        });

      userId = createResponse.body.id;
    });

    it('should delete a user successfully', () => {
      if (!userId) return; // Skip if no user was created

      return request(server)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return error for non-existent user', () => {
      return request(server)
        .delete('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return error for unauthorized request', () => {
      return request(server)
        .delete('/users/some-id')
        .expect(401);
    });
  });
});