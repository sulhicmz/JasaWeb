import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../../src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../../src/common/config/env.validation';

describe('AuthModule Security', () => {
  it('should fail to initialize without JWT_SECRET', async () => {
    // Mock environment without JWT_SECRET
    const originalEnv = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
          }),
          AuthModule,
        ],
      }).compile();

      // If we reach here, the test should fail because JWT_SECRET is required
      fail('AuthModule should not initialize without JWT_SECRET');
    } catch (error) {
      expect((error as Error).message).toContain('JWT_SECRET');
    } finally {
      // Restore original environment
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      }
    }
  });

  it('should initialize with valid JWT_SECRET', async () => {
    // Mock environment with valid JWT_SECRET
    const originalEnv = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars-long';

    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
          }),
          AuthModule,
        ],
      }).compile();

      expect(module).toBeDefined();
      await module.close();
    } finally {
      // Restore original environment
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      } else {
        delete process.env.JWT_SECRET;
      }
    }
  });
});
