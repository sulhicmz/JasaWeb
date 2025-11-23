import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default registerAs('security', () => ({
  // JWT Configuration
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: (() => {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
      }
      if (secret.length < 32) {
        throw new Error(
          'JWT_REFRESH_SECRET must be at least 32 characters long'
        );
      }
      return secret;
    })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password Policy
  password: {
    minLength: parseNumber(process.env.PASSWORD_MIN_LENGTH, 8),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
    maxAge: parseNumber(process.env.PASSWORD_MAX_AGE_DAYS, 90),
    preventReuse: parseNumber(process.env.PASSWORD_PREVENT_REUSE, 5),
  },

  // Account Lockout
  lockout: {
    enabled: process.env.ACCOUNT_LOCKOUT_ENABLED !== 'false',
    maxAttempts: parseNumber(process.env.LOCKOUT_MAX_ATTEMPTS, 5),
    duration: parseNumber(process.env.LOCKOUT_DURATION_MINUTES, 30),
    resetAfter: parseNumber(process.env.LOCKOUT_RESET_AFTER_MINUTES, 60),
  },

  // Session Configuration
  session: {
    secret: (() => {
      const secret = process.env.SESSION_SECRET;
      if (!secret) {
        throw new Error('SESSION_SECRET environment variable is required');
      }
      if (secret.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters long');
      }
      return secret;
    })(),
    maxAge: parseNumber(process.env.SESSION_MAX_AGE_HOURS, 24),
    absoluteTimeout: parseNumber(
      process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS,
      72
    ),
    inactivityTimeout: parseNumber(
      process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES,
      30
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },

  // Rate Limiting
  rateLimit: {
    global: {
      ttl: parseNumber(process.env.RATE_LIMIT_TTL, 60),
      limit: parseNumber(process.env.RATE_LIMIT_MAX, 100),
    },
    auth: {
      ttl: parseNumber(process.env.AUTH_RATE_LIMIT_TTL, 900),
      limit: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 5),
    },
    api: {
      ttl: parseNumber(process.env.API_RATE_LIMIT_TTL, 60),
      limit: parseNumber(process.env.API_RATE_LIMIT_MAX, 100),
    },
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4321'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600,
  },

  // Encryption
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: (() => {
      const key = process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
      }
      if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
      }
      return key;
    })(),
    ivLength: 16,
  },

  // Security Headers
  headers: {
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    frameguard: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
}));
