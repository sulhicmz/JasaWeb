import { validateEnv } from './env.validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('JWT_SECRET validation', () => {
    it('should pass with valid secure JWT secret', () => {
      const config = {
        JWT_SECRET:
          'a-very-secure-random-secret-key-that-is-at-least-32-chars-long',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).not.toThrow();
    });

    it('should fail with default example secret', () => {
      const config = {
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).toThrow(
        'JWT_SECRET must be at least 32 characters long and cannot use default or common weak values'
      );
    });

    it('should fail with short secret', () => {
      const config = {
        JWT_SECRET: 'short',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).toThrow(
        'JWT_SECRET must be at least 32 characters long and cannot use default or common weak values'
      );
    });

    it('should fail with common weak secrets', () => {
      const weakSecrets = [
        'secret',
        'password',
        'default_secret',
        'jwt_secret',
        '123456',
        'admin',
        'my-secret-password',
        'jwt-secret-key',
      ];

      weakSecrets.forEach((secret) => {
        const config = {
          JWT_SECRET: secret,
          DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        };

        expect(() => validateEnv(config)).toThrow(
          'JWT_SECRET must be at least 32 characters long and cannot use default or common weak values'
        );
      });
    });

    it('should fail when JWT_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).toThrow();
    });

    it('should pass with strong random secret', () => {
      const config = {
        JWT_SECRET: 'x'.repeat(64), // 64 character random string
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      expect(() => validateEnv(config)).not.toThrow();
    });
  });

  describe('DATABASE_URL validation', () => {
    it('should pass with valid PostgreSQL URL', () => {
      const config = {
        JWT_SECRET:
          'a-very-secure-random-secret-key-that-is-at-least-32-chars-long',
        DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      };

      expect(() => validateEnv(config)).not.toThrow();
    });

    it('should fail when DATABASE_URL is missing', () => {
      const config = {
        JWT_SECRET:
          'a-very-secure-random-secret-key-that-is-at-least-32-chars-long',
      };

      expect(() => validateEnv(config)).toThrow();
    });
  });

  describe('Optional environment variables', () => {
    it('should use default values for optional variables', () => {
      const config = {
        JWT_SECRET:
          'a-very-secure-random-secret-key-that-is-at-least-32-chars-long',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      };

      const validatedConfig = validateEnv(config);

      expect(validatedConfig.NODE_ENV).toBe('development');
      expect(validatedConfig.PORT).toBe(3000);
      expect(validatedConfig.JWT_EXPIRES_IN).toBe('1d');
      expect(validatedConfig.CORS_ORIGIN).toBe('http://localhost:4321');
      expect(validatedConfig.THROTTLE_TTL).toBe(60);
      expect(validatedConfig.THROTTLE_LIMIT).toBe(10);
      expect(validatedConfig.CACHE_TTL).toBe(5);
      expect(validatedConfig.CACHE_MAX).toBe(100);
      expect(validatedConfig.REDIS_HOST).toBe('localhost');
      expect(validatedConfig.REDIS_PORT).toBe(6379);
    });

    it('should accept custom values for optional variables', () => {
      const config = {
        JWT_SECRET:
          'a-very-secure-random-secret-key-that-is-at-least-32-chars-long',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        NODE_ENV: 'production',
        PORT: 8080,
        JWT_EXPIRES_IN: '2h',
        CORS_ORIGIN: 'https://example.com',
        THROTTLE_TTL: 120,
        THROTTLE_LIMIT: 20,
        CACHE_TTL: 10,
        CACHE_MAX: 200,
        REDIS_HOST: 'redis.example.com',
        REDIS_PORT: 6380,
      };

      const validatedConfig = validateEnv(config);

      expect(validatedConfig.NODE_ENV).toBe('production');
      expect(validatedConfig.PORT).toBe(8080);
      expect(validatedConfig.JWT_EXPIRES_IN).toBe('2h');
      expect(validatedConfig.CORS_ORIGIN).toBe('https://example.com');
      expect(validatedConfig.THROTTLE_TTL).toBe(120);
      expect(validatedConfig.THROTTLE_LIMIT).toBe(20);
      expect(validatedConfig.CACHE_MAX).toBe(200);
      expect(validatedConfig.REDIS_HOST).toBe('redis.example.com');
      expect(validatedConfig.REDIS_PORT).toBe(6380);
    });
  });
});
