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

// Mock Prisma for testing
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findOne: vi.fn(),
      findAll: vi.fn(),
      remove: vi.fn(),
      getProjectStats: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ticket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

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
