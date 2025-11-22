import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../env.validation';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../auth/auth.module';
import { SessionModule } from '../../../common/services/session.module';

describe('Environment Validation Security Tests', () => {
  describe('validateEnv', () => {
    it('should fail when JWT_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).toThrow(
        /Environment validation failed/
      );
    });

    it('should fail when JWT_SECRET is too short', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'short',
        JWT_REFRESH_SECRET: 'a'.repeat(32),
      };

      expect(() => validateEnv(config)).toThrow(
        'JWT_SECRET must be at least 32 characters long for security'
      );
    });

    it('should fail when JWT_REFRESH_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
      };

      expect(() => validateEnv(config)).toThrow(
        /Environment validation failed/
      );
    });

    it('should fail when JWT_REFRESH_SECRET is too short', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'short',
      };

      expect(() => validateEnv(config)).toThrow(
        'JWT_REFRESH_SECRET must be at least 32 characters long for security'
      );
    });

    it('should pass with valid JWT secrets', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
      };

      expect(() => validateEnv(config)).not.toThrow();
    });
  });

  describe('JWT Module Configuration', () => {
    let module: TestingModule;

    beforeEach(async () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.DATABASE_URL;
    });

    it('should fail to initialize AuthModule without JWT_SECRET', async () => {
      delete process.env.JWT_SECRET;

      try {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              validate: validateEnv,
            }),
            AuthModule,
          ],
        }).compile();
        fail('Expected module initialization to fail');
      } catch (error) {
        expect(error.message).toContain('JWT_SECRET');
      }
    });

    it('should fail to initialize SessionModule without JWT_SECRET', async () => {
      delete process.env.JWT_SECRET;

      try {
        module = await Test.createTestingModule({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              validate: validateEnv,
            }),
            SessionModule,
          ],
        }).compile();
        fail('Expected module initialization to fail');
      } catch (error) {
        expect(error.message).toContain('JWT_SECRET');
      }
    });

    it('should successfully initialize modules with valid JWT secrets', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
          }),
          AuthModule,
          SessionModule,
        ],
      }).compile();

      expect(module).toBeDefined();
    });
  });
});
