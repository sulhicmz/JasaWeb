// Comprehensive NestJS module mocks for testing
import { vi } from 'vitest';

// Mock @nestjs/core
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

// Mock @nestjs/platform-express
vi.mock('@nestjs/platform-express', () => ({
  ExpressAdapter: vi.fn(),
}));

// Mock @nestjs/passport
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

// Mock @nestjs/common
vi.mock('@nestjs/common', () => ({
  Injectable: vi.fn().mockImplementation(() => class MockInjectable {}),
  Controller: vi.fn().mockImplementation(() => class MockController {}),
  Module: vi.fn().mockImplementation(() => class MockModule {}),
  Get: vi.fn(),
  Post: vi.fn(),
  Put: vi.fn(),
  Delete: vi.fn(),
  Patch: vi.fn(),
  Param: vi.fn(),
  Body: vi.fn(),
  Query: vi.fn(),
  Headers: vi.fn(),
  Req: vi.fn(),
  Res: vi.fn(),
  Session: vi.fn(),
  Ip: vi.fn(),
  HostParam: vi.fn(),
  SetMetadata: vi.fn(),
  UseGuards: vi.fn(),
  UseInterceptors: vi.fn(),
  UseFilters: vi.fn(),
  UsePipes: vi.fn(),
  HttpException: vi.fn(),
  BadRequestException: vi.fn(),
  UnauthorizedException: vi.fn(),
  ForbiddenException: vi.fn(),
  NotFoundException: vi.fn(),
  ConflictException: vi.fn(),
  InternalServerErrorException: vi.fn(),
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  })),
  ValidationPipe: vi.fn(),
  ParseIntPipe: vi.fn(),
  ParseUUIDPipe: vi.fn(),
  ParseBoolPipe: vi.fn(),
  ParseFloatPipe: vi.fn(),
  DefaultValuePipe: vi.fn(),
  Optional: vi.fn(),
  ParseEnumPipe: vi.fn(),
  ParseArrayPipe: vi.fn(),
  Inject: vi.fn(),
  InjectRepository: vi.fn(),
  forwardRef: vi.fn(),
  InjectableStrategy: vi.fn(),
  Scope: vi.fn(),
  OnModuleInit: vi.fn(),
  OnApplicationBootstrap: vi.fn(),
  OnModuleDestroy: vi.fn(),
  BeforeApplicationShutdown: vi.fn(),
  OnApplicationShutdown: vi.fn(),
}));

// Mock @nestjs/config
vi.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: vi.fn(),
    forRootAsync: vi.fn(),
  },
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    getOrThrow: vi.fn(),
    isProduction: vi.fn(),
    getCorsOrigins: vi.fn(),
  })),
}));

// Mock @nestjs/jwt
vi.mock('@nestjs/jwt', () => ({
  JwtModule: {
    register: vi.fn(),
    registerAsync: vi.fn(),
  },
  JwtService: vi.fn().mockImplementation(() => ({
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ userId: 'test-user-id' }),
    verifyAsync: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
  })),
}));

// Mock @nestjs/swagger
vi.mock('@nestjs/swagger', () => ({
  ApiProperty: vi.fn(),
  ApiPropertyOptional: vi.fn(),
  ApiResponse: vi.fn(),
  ApiOperation: vi.fn(),
  ApiTags: vi.fn(),
  ApiBearerAuth: vi.fn(),
  ApiBasicAuth: vi.fn(),
  ApiCookieAuth: vi.fn(),
  ApiHeader: vi.fn(),
  ApiParam: vi.fn(),
  ApiQuery: vi.fn(),
  ApiBody: vi.fn(),
  ApiConsumes: vi.fn(),
  ApiProduces: vi.fn(),
  ApiExcludeController: vi.fn(),
  ApiExcludeEndpoint: vi.fn(),
  ApiSecurity: vi.fn(),
  ApiExtraModels: vi.fn(),
  ApiNotFoundResponse: vi.fn(),
  ApiBadRequestResponse: vi.fn(),
  ApiUnauthorizedResponse: vi.fn(),
  ApiForbiddenResponse: vi.fn(),
  ApiInternalServerErrorResponse: vi.fn(),
  DocumentBuilder: vi.fn().mockImplementation(() => ({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    setVersion: vi.fn().mockReturnThis(),
    addTag: vi.fn().mockReturnThis(),
    addBearerAuth: vi.fn().mockReturnThis(),
    addBasicAuth: vi.fn().mockReturnThis(),
    addCookieAuth: vi.fn().mockReturnThis(),
    addApiKey: vi.fn().mockReturnThis(),
    addServer: vi.fn().mockReturnThis(),
    addSecurity: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      setup: vi.fn(),
    }),
  })),
  SwaggerModule: {
    createDocument: vi.fn(),
    setup: vi.fn(),
  },
}));

// Mock passport-jwt
vi.mock('passport-jwt', () => ({
  Strategy: vi.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: vi.fn(),
    fromExtractors: vi.fn(),
  },
}));

// Mock passport-local
vi.mock('passport-local', () => ({
  Strategy: vi.fn(),
}));

// Mock argon2
vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true),
}));

// Mock nodemailer
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

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-1234'),
  v1: vi.fn().mockReturnValue('mock-uuid-v1'),
}));

// Mock joi
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

// Mock @nestjs/testing
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
  ClientProxyFactory: {
    create: vi.fn(),
  },
  Transport: {
    TCP: 'tcp',
    Redis: 'redis',
    NATS: 'nats',
    MQTT: 'mqtt',
    GRPC: 'grpc',
  },
  MicroserviceOptions: vi.fn(),
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  genSalt: vi.fn().mockResolvedValue('salt'),
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
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
      count: vi.fn(),
    },
    ticket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    milestone: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    file: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    approval: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    membership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    refreshToken: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
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
  RefreshToken: vi.fn(),
}));
