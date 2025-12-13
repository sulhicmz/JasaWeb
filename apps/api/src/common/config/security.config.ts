import { registerAs } from '@nestjs/config';
import {
  getRequiredEnv,
  getEnvNumber,
  getEnvBoolean,
  getOptionalEnv,
} from '@jasaweb/config/env-validation';

export default registerAs('security', () => {
  // Validate required secrets first
  const jwtSecret = getRequiredEnv('JWT_SECRET');
  const jwtRefreshSecret = getRequiredEnv('JWT_REFRESH_SECRET');
  const sessionSecret = getRequiredEnv('SESSION_SECRET');
  const encryptionKey = getRequiredEnv('ENCRYPTION_KEY');

  // Parse CORS origins safely
  const corsOrigin = getOptionalEnv('CORS_ORIGIN');
  const origins = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : [];

  return {
    // JWT Configuration
    jwt: {
      secret: jwtSecret,
      expiresIn: getOptionalEnv('JWT_EXPIRES_IN', '1h'),
      refreshSecret: jwtRefreshSecret,
      refreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    },

    // Password Policy
    password: {
      minLength: getEnvNumber('PASSWORD_MIN_LENGTH', 8),
      requireUppercase: getEnvBoolean('PASSWORD_REQUIRE_UPPERCASE', true),
      requireLowercase: getEnvBoolean('PASSWORD_REQUIRE_LOWERCASE', true),
      requireNumbers: getEnvBoolean('PASSWORD_REQUIRE_NUMBERS', true),
      requireSpecialChars: getEnvBoolean('PASSWORD_REQUIRE_SPECIAL', true),
      maxAge: getEnvNumber('PASSWORD_MAX_AGE_DAYS', 90),
      preventReuse: getEnvNumber('PASSWORD_PREVENT_REUSE', 5),
    },

    // Account Lockout
    lockout: {
      enabled: getEnvBoolean('ACCOUNT_LOCKOUT_ENABLED', true),
      maxAttempts: getEnvNumber('LOCKOUT_MAX_ATTEMPTS', 5),
      duration: getEnvNumber('LOCKOUT_DURATION_MINUTES', 30),
      resetAfter: getEnvNumber('LOCKOUT_RESET_AFTER_MINUTES', 60),
    },

    // Session Configuration
    session: {
      secret: sessionSecret,
      maxAge: getEnvNumber('SESSION_MAX_AGE_HOURS', 24),
      absoluteTimeout: getEnvNumber('SESSION_ABSOLUTE_TIMEOUT_HOURS', 72),
      inactivityTimeout: getEnvNumber('SESSION_INACTIVITY_TIMEOUT_MINUTES', 30),
      secure: getOptionalEnv('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
    },

    // Rate Limiting
    rateLimit: {
      global: {
        ttl: getEnvNumber('RATE_LIMIT_TTL', 60),
        limit: getEnvNumber('RATE_LIMIT_MAX', 100),
      },
      auth: {
        ttl: getEnvNumber('AUTH_RATE_LIMIT_TTL', 900),
        limit: getEnvNumber('AUTH_RATE_LIMIT_MAX', 5),
      },
      api: {
        ttl: getEnvNumber('API_RATE_LIMIT_TTL', 60),
        limit: getEnvNumber('API_RATE_LIMIT_MAX', 100),
      },
    },

    // CORS Configuration
    cors: {
      origin: origins.length > 0 ? origins : ['http://localhost:4321'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 3600,
    },

    // Encryption
    encryption: {
      algorithm: getOptionalEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
      key: encryptionKey,
      ivLength: 16,
    },

    // Security Headers
    headers: {
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: getOptionalEnv('NODE_ENV') === 'production',
      frameguard: true,
      noSniff: true,
      xssFilter: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
  };
});
