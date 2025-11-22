import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../common/config/env.validation';
import { AuthModule } from '../auth/auth.module';
import { SessionModule } from '../common/services/session.module';

describe('Security Configuration Tests', () => {
  describe('Environment Validation', () => {
    it('should fail validation when JWT_SECRET is missing', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'Environment validation failed'
      );
    });

    it('should fail validation when JWT_SECRET is too short', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'short',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'JWT_SECRET must be at least 32 characters long'
      );
    });

    it('should fail validation when JWT_SECRET uses default value', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'default_secret',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'JWT_SECRET cannot use default/example values'
      );
    });

    it('should fail validation when JWT_SECRET uses example value', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'your-super-secret-jwt-key',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'JWT_SECRET cannot use default/example values'
      );
    });

    it('should pass validation with strong JWT_SECRET', () => {
      const validConfig = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'strong-32-character-secret-key-here-1234567890',
      };

      expect(() => validateEnv(validConfig)).not.toThrow();
    });
  });

  describe('Module Configuration', () => {
    it('should fail to create AuthModule without JWT_SECRET', async () => {
      process.env.JWT_SECRET = '';

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
        fail('Expected module creation to fail');
      } catch (error) {
        expect(error.message).toContain('Environment validation failed');
      }
    });

    it('should fail to create SessionModule without JWT_SECRET', async () => {
      process.env.JWT_SECRET = '';

      try {
        await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              validate: validateEnv,
            }),
            SessionModule,
          ],
        }).compile();
        fail('Expected module creation to fail');
      } catch (error) {
        expect(error.message).toContain('Environment validation failed');
      }
    });
  });
});
