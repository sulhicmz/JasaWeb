// Vitest setup file for test environment
import { vi } from 'vitest';

// Provide Jest compatibility for existing tests
interface JestMock {
  fn: typeof vi.fn;
  mock: typeof vi.mock;
  spyOn: typeof vi.spyOn;
  clearAllMocks: typeof vi.clearAllMocks;
  resetAllMocks: typeof vi.resetAllMocks;
  restoreAllMocks: typeof vi.restoreAllMocks;
  useFakeTimers: typeof vi.useFakeTimers;
  useRealTimers: typeof vi.useRealTimers;
  advanceTimersByTime: typeof vi.advanceTimersByTime;
  runOnlyPendingTimers: typeof vi.runOnlyPendingTimers;
  runAllTimers: typeof vi.runAllTimers;
}

beforeAll(() => {
  // Create global jest object with vi methods
  (global as Record<string, JestMock>).jest = {
    fn: vi.fn,
    mock: vi.mock,
    spyOn: vi.spyOn,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    runAllTimers: vi.runAllTimers,
  };
});

// Set up Reflect for NestJS decorators
import 'reflect-metadata';

// Mock bcrypt with proper functions
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
  genSalt: vi.fn().mockResolvedValue('salt'),
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK',
    }),
  }),
}));

// Mock @nestjs/jwt
vi.mock('@nestjs/jwt', () => ({
  JwtService: vi.fn().mockImplementation(() => ({
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi
      .fn()
      .mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
    verifyAsync: vi
      .fn()
      .mockResolvedValue({ userId: 'test-user-id', email: 'test@example.com' }),
  })),
}));

// Mock @nestjs/config
vi.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: vi.fn(() => ({ module: 'ConfigModule' })),
    isGlobal: true,
  },
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string) => {
      const defaults = {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        SMTP_HOST: 'localhost',
        SMTP_PORT: 587,
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'test-password',
      };
      return defaults[key] || null;
    }),
    isProduction: vi.fn().mockReturnValue(false),
    getCorsOrigins: vi.fn().mockReturnValue(['http://localhost:3000']),
  })),
}));

// Mock @nestjs-modules/mailer
vi.mock('@nestjs-modules/mailer', () => ({
  MailerService: vi.fn().mockImplementation(() => ({
    sendMail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK',
    }),
  })),
  MailerModule: {
    forRootAsync: vi.fn(() => ({ module: 'MailerModule' })),
  },
}));

// Mock cache-manager
vi.mock('cache-manager', () => ({
  CACHE_MANAGER: Symbol('CACHE_MANAGER'),
  cacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    reset: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
  },
}));

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

// Export empty to make this a module
export {};

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock cache-manager
vi.mock('cache-manager', () => ({
  CACHE_MANAGER: Symbol('CACHE_MANAGER'),
}));

// Mock @nestjs/jwt
vi.mock('@nestjs/jwt', () => ({
  JwtService: vi.fn().mockImplementation(() => ({
    sign: vi.fn(),
    verify: vi.fn(),
    verifyAsync: vi.fn(),
  })),
}));

// Mock @nestjs/config
vi.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: vi.fn(() => ({ module: 'ConfigModule' })),
    isGlobal: true,
  },
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
  })),
}));

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

// Export empty to make this a module
export {};
