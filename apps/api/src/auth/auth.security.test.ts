import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { SessionModule } from '../common/services/session.module';
import { validateEnv } from '../common/config/env.validation';

describe('JWT Security Configuration', () => {
  describe('Environment Validation', () => {
    it('should fail validation when JWT_SECRET is missing', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        /JWT_SECRET must be a string/
      );
    });

    it('should fail validation when JWT_SECRET is too short', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'short',
        JWT_REFRESH_SECRET: 'a'.repeat(32),
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        /JWT_SECRET must be at least 32 characters long/
      );
    });

    it('should fail validation when JWT_REFRESH_SECRET is missing', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        /JWT_REFRESH_SECRET must be a string/
      );
    });

    it('should fail validation when JWT_REFRESH_SECRET is too short', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'short',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        /JWT_REFRESH_SECRET must be at least 32 characters long/
      );
    });

    it('should pass validation with proper JWT secrets', () => {
      const validConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
      };

      expect(() => validateEnv(validConfig)).not.toThrow();
    });
  });

  describe('JWT Module Registration', () => {
    it('should fail to create AuthModule without JWT_SECRET', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      await expect(
        Test.createTestingModule({
          imports: [AuthModule],
        }).compile()
      ).rejects.toThrow();

      process.env.JWT_SECRET = originalEnv;
    });

    it('should fail to create SessionModule without JWT_SECRET', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      await expect(
        Test.createTestingModule({
          imports: [SessionModule],
        }).compile()
      ).rejects.toThrow();

      process.env.JWT_SECRET = originalEnv;
    });
  });
});
