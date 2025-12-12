import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../common/config/env.validation';
import { AuthModule } from './auth.module';
import { SessionModule } from '../common/services/session.module';

describe('Security Configuration Tests', () => {
  describe('Environment Validation', () => {
    it('should fail validation when JWT_SECRET is missing', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'Environment validation failed'
      );
    });

    it('should fail validation when JWT_SECRET is too short', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_SECRET: 'short',
        JWT_REFRESH_SECRET: 'valid_refresh_secret_that_is_long_enough',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'JWT_SECRET must be at least 32 characters long'
      );
    });

    it('should fail validation when JWT_REFRESH_SECRET is missing', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_SECRET: 'valid_jwt_secret_that_is_long_enough',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'Environment validation failed'
      );
    });

    it('should fail validation when JWT_REFRESH_SECRET is too short', () => {
      const invalidConfig = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_SECRET: 'valid_jwt_secret_that_is_long_enough',
        JWT_REFRESH_SECRET: 'short',
      };

      expect(() => validateEnv(invalidConfig)).toThrow(
        'JWT_REFRESH_SECRET must be at least 32 characters long'
      );
    });

    it('should pass validation with proper JWT secrets', () => {
      const validConfig = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_SECRET: 'valid_jwt_secret_that_is_long_enough',
        JWT_REFRESH_SECRET: 'valid_refresh_secret_that_is_long_enough',
      };

      expect(() => validateEnv(validConfig)).not.toThrow();
    });
  });

  describe('Module Configuration', () => {
    it('should fail to create AuthModule without JWT_SECRET', async () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_REFRESH_SECRET: 'valid_refresh_secret_that_is_long_enough',
      };

      let errorThrown = false;
      try {
        await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              validate: () => validateEnv(invalidEnv),
            }),
            AuthModule,
          ],
        }).compile();
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).toContain(
          'Environment validation failed'
        );
      }

      expect(errorThrown).toBe(true);
    });

    it('should fail to create SessionModule without JWT_SECRET', async () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://test:password@localhost:5432/jasaweb_test',
        JWT_REFRESH_SECRET: 'valid_refresh_secret_that_is_long_enough',
      };

      let errorThrown = false;
      try {
        await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              validate: () => validateEnv(invalidEnv),
            }),
            SessionModule,
          ],
        }).compile();
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).toContain(
          'Environment validation failed'
        );
      }

      expect(errorThrown).toBe(true);
    });
  });
});
