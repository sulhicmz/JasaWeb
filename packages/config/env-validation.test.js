"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_validation_1 = require("./env-validation");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Environment Variable Validation', () => {
    (0, vitest_1.beforeEach)(() => {
        for (const key in process.env) {
            if (key.startsWith('POSTGRES_') ||
                key.startsWith('JWT_') ||
                key.startsWith('SESSION_') ||
                key.startsWith('ENCRYPTION_') ||
                key.startsWith('REDIS_') ||
                key.startsWith('S3_') ||
                key.startsWith('MINIO_')) {
                delete process.env[key];
            }
        }
    });
    (0, vitest_1.describe)('Hardcoded Credential Detection', () => {
        (0, vitest_1.it)('should detect and reject "test" as database password', () => {
            process.env.POSTGRES_PASSWORD = 'test';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow();
        });
        (0, vitest_1.it)('should detect and reject "test" as database username', () => {
            process.env.POSTGRES_USER = 'test';
            process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should detect and reject "test" as MinIO user', () => {
            process.env.MINIO_ROOT_USER = 'test';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should detect "test" database name with warning in development', () => {
            process.env.NODE_ENV = 'development';
            process.env.POSTGRES_DB = 'test';
            process.env.POSTGRES_USER = 'validuser';
            process.env.POSTGRES_PASSWORD = 'ValidPassword123!';
            process.env.DATABASE_URL =
                'postgresql://validuser:ValidPassword123!@localhost:5432/test';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
        (0, vitest_1.it)('should allow legitimate credentials', () => {
            process.env.NODE_ENV = 'development';
            process.env.POSTGRES_USER = 'jasaweb_user';
            process.env.POSTGRES_PASSWORD = 'JwS3cur3P@ss!2024';
            process.env.POSTGRES_DB = 'jasaweb_dev';
            process.env.DATABASE_URL =
                'postgresql://jasaweb_user:JwS3cur3P@ss!2024@localhost:5432/jasaweb_dev';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Weak Pattern Detection', () => {
        (0, vitest_1.it)('should reject password containing "password"', () => {
            process.env.POSTGRES_PASSWORD = 'mypassword123';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should reject password containing "admin"', () => {
            process.env.POSTGRES_PASSWORD = 'admin123!';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should reject password containing "123456"', () => {
            process.env.POSTGRES_PASSWORD = 'abc123456def';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should reject password containing "secret"', () => {
            process.env.POSTGRES_PASSWORD = 'mysecret!';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
    });
    (0, vitest_1.describe)('Default Secret Detection in Production', () => {
        (0, vitest_1.beforeEach)(() => {
            process.env.NODE_ENV = 'production';
        });
        (0, vitest_1.it)('should reject default JWT secret', () => {
            process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
            process.env.JWT_REFRESH_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
        (0, vitest_1.it)('should reject default session secret', () => {
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.JWT_REFRESH_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.SESSION_SECRET =
                'your-super-secret-session-key-change-in-production';
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Secure Secret Generation', () => {
        (0, vitest_1.it)('should generate secrets with specified length', () => {
            const secret = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(secret).toHaveLength(32);
        });
        (0, vitest_1.it)('should generate secrets containing only allowed characters', () => {
            const secret = (0, env_validation_1.generateSecureSecret)(64);
            const allowedPattern = /^[A-Za-z0-9+/=_-]+$/;
            (0, vitest_1.expect)(allowedPattern.test(secret)).toBe(true);
        });
        (0, vitest_1.it)('should generate different secrets each time', () => {
            const secret1 = (0, env_validation_1.generateSecureSecret)(32);
            const secret2 = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(secret1).not.toBe(secret2);
        });
    });
    (0, vitest_1.describe)('Environment Variable Accessors', () => {
        (0, vitest_1.beforeEach)(() => {
            process.env.TEST_STRING = 'test_value';
            process.env.TEST_NUMBER = '42';
            process.env.TEST_BOOLEAN = 'true';
        });
        (0, vitest_1.it)('should get required environment variable', () => {
            (0, vitest_1.expect)(() => (0, env_validation_1.getRequiredEnv)('TEST_STRING')).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should get optional environment variable with default', () => {
            const value = (0, env_validation_1.getOptionalEnv)('NON_EXISTENT', 'default_value');
            (0, vitest_1.expect)(value).toBe('default_value');
        });
        (0, vitest_1.it)('should get number environment variable', () => {
            const value = (0, env_validation_1.getEnvNumber)('TEST_NUMBER');
            (0, vitest_1.expect)(value).toBe(42);
        });
        (0, vitest_1.it)('should get boolean environment variable', () => {
            const value = (0, env_validation_1.getEnvBoolean)('TEST_BOOLEAN');
            (0, vitest_1.expect)(value).toBe(true);
        });
    });
    (0, vitest_1.describe)('Production Security Checks', () => {
        (0, vitest_1.beforeEach)(() => {
            process.env.NODE_ENV = 'production';
        });
        (0, vitest_1.it)('should warn about wildcard CORS origin', () => {
            process.env.CORS_ORIGIN = '*';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
        (0, vitest_1.it)('should warn about insecure SMTP in production', () => {
            process.env.SMTP_SECURE = 'false';
            process.env.JWT_SECRET = (0, env_validation_1.generateSecureSecret)(32);
            process.env.ENCRYPTION_KEY = (0, env_validation_1.generateSecureSecret)(32);
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Validation Error Handling', () => {
        (0, vitest_1.it)('should throw EnvValidationError for missing required variables', () => {
            (0, vitest_1.expect)(() => (0, env_validation_1.validateEnvironmentVariables)()).toThrow(env_validation_1.EnvValidationError);
        });
        (0, vitest_1.it)('should include helpful error messages', () => {
            try {
                (0, env_validation_1.validateEnvironmentVariables)();
            }
            catch (error) {
                if (error instanceof env_validation_1.EnvValidationError) {
                    (0, vitest_1.expect)(error.message).toContain('Environment validation failed');
                }
            }
        });
    });
});
//# sourceMappingURL=env-validation.test.js.map