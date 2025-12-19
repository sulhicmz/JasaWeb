// Vitest setup file for test environment
import { vi } from 'vitest';

// Set up Reflect for NestJS decorators - this must be loaded first
import 'reflect-metadata';

// Ensure vitest globals are available
const globalVitest = global as typeof globalThis & {
  describe?: typeof describe;
  it?: typeof it;
  test?: typeof test;
  expect?: typeof expect;
  beforeAll?: typeof beforeAll;
  afterAll?: typeof afterAll;
  beforeEach?: typeof beforeEach;
  afterEach?: typeof afterEach;
};

globalVitest.describe = globalVitest.describe || describe;
globalVitest.it = globalVitest.it || it;
globalVitest.test = globalVitest.test || test;
globalVitest.expect = globalVitest.expect || expect;
globalVitest.beforeAll = globalVitest.beforeAll || beforeAll;
globalVitest.afterAll = globalVitest.afterAll || afterAll;
globalVitest.beforeEach = globalVitest.beforeEach || beforeEach;
globalVitest.afterEach = globalVitest.afterAll || afterEach;

// Provide Jest compatibility for existing tests
beforeAll(() => {
  // Create global jest object with vi methods
  (global as Record<string, unknown>).jest = {
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

// Mock Prisma for testing
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    ticket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    milestone: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    file: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    approval: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    membership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  })),
  User: vi.fn(),
  Organization: vi.fn(),
  Project: vi.fn(),
  Task: vi.fn(),
  Ticket: vi.fn(),
  Milestone: vi.fn(),
  Invoice: vi.fn(),
  File: vi.fn(),
  Approval: vi.fn(),
  Membership: vi.fn(),
  AuditLog: vi.fn(),
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
  genSalt: vi.fn(),
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
    forFeature: vi.fn(() => ({ module: 'ConfigModule' })),
    isGlobal: true,
  },
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string) => {
      const defaults = {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        PORT: 3000,
      };
      return defaults[key] || null;
    }),
  })),
}));

// Mock other NestJS modules
vi.mock('@nestjs/core', () => ({
  NestFactory: {
    create: vi.fn().mockResolvedValue({
      listen: vi.fn(),
      useGlobalPipes: vi.fn(),
      useGlobalFilters: vi.fn(),
      useGlobalInterceptors: vi.fn(),
      useGlobalGuards: vi.fn(),
      close: vi.fn(),
    }),
  },
  Reflector: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  REQUEST: Symbol('REQUEST'),
  APP_FILTER: Symbol('APP_FILTER'),
  APP_INTERCEPTOR: Symbol('APP_INTERCEPTOR'),
  APP_GUARD: Symbol('APP_GUARD'),
}));

vi.mock('@nestjs/platform-express', () => ({
  ExpressAdapter: vi.fn(),
}));

vi.mock('@nestjs/passport', () => ({
  PassportModule: {
    register: vi.fn(),
    login: vi.fn(),
  },
  AuthGuard: vi.fn().mockImplementation((strategy?: string) => {
    return class MockAuthGuard {
      canActivate() {
        return true;
      }
    };
  }),
  PassportAuthGuard: vi.fn().mockImplementation((strategy?: string) => {
    return class MockPassportAuthGuard {
      canActivate() {
        return true;
      }
    };
  }),
}));

vi.mock('@nestjs/common', () => ({
  Injectable: vi
    .fn()
    .mockImplementation((options?: any) => (target: any) => target),
  Controller: vi.fn().mockImplementation(() => (target: any) => target),
  Get: vi
    .fn()
    .mockImplementation(
      (path?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  Post: vi
    .fn()
    .mockImplementation(
      (path?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  Put: vi
    .fn()
    .mockImplementation(
      (path?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  Delete: vi
    .fn()
    .mockImplementation(
      (path?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  Patch: vi
    .fn()
    .mockImplementation(
      (path?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  Param: vi
    .fn()
    .mockImplementation(
      (param?: string) => (target: any, key?: string, index?: number) => {}
    ),
  Body: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  Query: vi
    .fn()
    .mockImplementation(
      (query?: string) => (target: any, key?: string, index?: number) => {}
    ),
  Headers: vi
    .fn()
    .mockImplementation(
      (header?: string) => (target: any, key?: string, index?: number) => {}
    ),
  Req: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  Res: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  Inject: vi
    .fn()
    .mockImplementation(
      (token?: any) => (target: any, key?: string, index?: number) => {}
    ),
  Scope: {
    DEFAULT: 'DEFAULT',
    REQUEST: 'REQUEST',
    TRANSIENT: 'TRANSIENT',
  },
  HttpStatus: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  UnauthorizedException: class UnauthorizedException extends Error {},
  BadRequestException: class BadRequestException extends Error {},
  ForbiddenException: class ForbiddenException extends Error {},
  NotFoundException: class NotFoundException extends Error {},
  InternalServerErrorException: class InternalServerErrorException extends Error {},
  ValidationPipe: vi
    .fn()
    .mockImplementation(
      (options?: any) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  ParseIntPipe: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  UseGuards: vi.fn().mockImplementation(
    (...guards: any[]) =>
      (target: any, key?: string, descriptor?: any) =>
        descriptor
  ),
  UseInterceptors: vi.fn().mockImplementation(
    (...interceptors: any[]) =>
      (target: any, key?: string, descriptor?: any) =>
        descriptor
  ),
  UseFilters: vi.fn().mockImplementation(
    (...filters: any[]) =>
      (target: any, key?: string, descriptor?: any) =>
        descriptor
  ),
  SetMetadata: vi
    .fn()
    .mockImplementation(
      (key: string, value: any) =>
        (target: any, key2?: string, descriptor?: any) =>
          descriptor
    ),
  createParamDecorator: vi.fn().mockImplementation((fn: any) => fn),
  ExecutionContext: vi.fn().mockImplementation(() => ({
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn(),
      getResponse: vi.fn(),
    }),
    getClass: vi.fn(),
    getHandler: vi.fn(),
  })),
  Logger: vi.fn().mockImplementation((name?: string) => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  })),
  InjectableOptions: {},
}));

vi.mock('@nestjs/websockets', () => ({
  WebSocketGateway: vi.fn().mockImplementation(
    (...args: any[]) =>
      (target: any) =>
        target
  ),
  SubscribeMessage: vi
    .fn()
    .mockImplementation(
      (message?: string) => (target: any, key?: string, descriptor?: any) =>
        descriptor
    ),
  MessageBody: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  ConnectedSocket: vi
    .fn()
    .mockImplementation(
      () => (target: any, key?: string, index?: number) => {}
    ),
  WebSocketServer: vi
    .fn()
    .mockImplementation(() => (target: any, key?: string) => {}),
  OnGatewayInit: vi.fn().mockImplementation(() => (target: any) => target),
  OnGatewayConnection: vi
    .fn()
    .mockImplementation(() => (target: any) => target),
  OnGatewayDisconnect: vi
    .fn()
    .mockImplementation(() => (target: any) => target),
  WsException: class WsException extends Error {},
}));

vi.mock('@nestjs/swagger', () => ({
  ApiTags: vi.fn(),
  ApiOperation: vi.fn(),
  ApiResponse: vi.fn(),
  ApiBody: vi.fn(),
  ApiParam: vi.fn(),
  ApiQuery: vi.fn(),
  ApiProperty: vi.fn(),
  ApiPropertyOptional: vi.fn(),
  ApiCreatedResponse: vi.fn(),
  ApiBadRequestResponse: vi.fn(),
  ApiUnauthorizedResponse: vi.fn(),
  ApiForbiddenResponse: vi.fn(),
  ApiNotFoundResponse: vi.fn(),
  ApiInternalServerErrorResponse: vi.fn(),
  ApiBearerAuth: vi.fn(),
}));

vi.mock('passport', () => ({
  authenticate: vi.fn(),
  authorize: vi.fn(),
  initialize: vi.fn(),
  session: vi.fn(),
}));

vi.mock('passport-jwt', () => ({
  Strategy: vi.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: vi.fn(),
    fromExtractors: vi.fn(),
  },
}));

vi.mock('passport-local', () => ({
  Strategy: vi.fn(),
}));

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true),
}));

vi.mock('nodemailer', () => ({
  createTransporter: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK',
    }),
  }),
  createTestAccount: vi.fn().mockResolvedValue({
    user: 'test@ethereal.email',
    pass: 'test-password',
  }),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-1234'),
  v1: vi.fn().mockReturnValue('mock-uuid-v1'),
}));

vi.mock('joi', () => ({
  string: vi.fn().mockReturnValue({
    required: vi.fn(),
    optional: vi.fn(),
    email: vi.fn(),
    min: vi.fn(),
    max: vi.fn(),
  }),
  number: vi.fn().mockReturnValue({
    required: vi.fn(),
    optional: vi.fn(),
    min: vi.fn(),
    max: vi.fn(),
  }),
  boolean: vi.fn().mockReturnValue({
    required: vi.fn(),
    optional: vi.fn(),
  }),
  object: vi.fn().mockReturnValue({
    required: vi.fn(),
    optional: vi.fn(),
  }),
  array: vi.fn().mockReturnValue({
    required: vi.fn(),
    optional: vi.fn(),
  }),
  validate: vi.fn(),
}));

// Mock @nestjs/testing specifically
vi.mock('@nestjs/testing', () => ({
  Test: {
    createTestingModule: vi.fn().mockReturnValue({
      setCustomProviders: vi.fn().mockReturnValue({
        compile: vi.fn().mockResolvedValue({
          get: vi.fn(),
          close: vi.fn(),
        }),
      }),
      compile: vi.fn().mockResolvedValue({
        get: vi.fn(),
        close: vi.fn(),
      }),
    }),
  },
}));

// Mock @nestjs/cache-manager
vi.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: Symbol('CACHE_MANAGER'),
  CacheModule: {
    register: vi.fn(),
    registerAsync: vi.fn(),
  },
  default: {
    register: vi.fn(),
    registerAsync: vi.fn(),
  },
}));

// Mock @nestjs/microservices
vi.mock('@nestjs/microservices', () => ({
  ClientProxy: vi.fn(),
  ClientKafka: vi.fn(),
  ClientTCP: vi.fn(),
  Transport: {
    TCP: 'TCP',
    KAFKA: 'KAFKA',
    NATS: 'NATS',
  },
}));

// Mock @nestjs/throttler
vi.mock('@nestjs/throttler', () => ({
  ThrottlerModule: {
    register: vi.fn(),
    registerAsync: vi.fn(),
  },
  ThrottlerGuard: vi.fn().mockImplementation(() => ({
    canActivate: vi.fn(),
  })),
}));

// Mock @nestjs/terminus
vi.mock('@nestjs/terminus', () => ({
  TerminusModule: {
    forRoot: vi.fn(),
  },
  HealthCheckService: vi.fn(),
  TypeOrmHealthIndicator: vi.fn(),
  MicroserviceHealthIndicator: vi.fn(),
}));

// Mock @nestjs/schedule
vi.mock('@nestjs/schedule', () => ({
  ScheduleModule: {
    forRoot: vi.fn(),
  },
  Cron: vi.fn(),
  Interval: vi.fn(),
  Timeout: vi.fn(),
}));

// Mock @nestjs-modules/mailer
vi.mock('@nestjs-modules/mailer', () => ({
  MailerModule: {
    registerAsync: vi.fn(),
  },
  HandlebarsAdapter: vi.fn(),
  MailerService: vi.fn().mockImplementation(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

// Mock other Node.js modules
vi.mock('compression', () => ({
  default: vi.fn().mockReturnValue((req: any, res: any, next: any) => next()),
}));

vi.mock('helmet', () => ({
  default: vi.fn().mockReturnValue((req: any, res: any, next: any) => next()),
}));

vi.mock('socket.io', () => ({
  Server: vi.fn(),
  Socket: vi.fn(),
}));

vi.mock('cache-manager-redis-yet', () => ({
  redisStore: vi.fn(),
}));

vi.mock('redis', () => ({
  createClient: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }),
}));

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

// Export empty to make this a module
export {};
