// Testing utilities and helpers for JasaWeb
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Type,
  DynamicModule,
  ForwardReference,
  Provider,
} from '@nestjs/common';
import { vi } from 'vitest';

// Export Vitest configurations
export {
  baseVitestConfig,
  apiVitestConfig,
  webVitestConfig,
  packageVitestConfig,
} from './vitest.base.config';

// Export test config helper
export { TestConfigHelper } from './test-config-helper';

/**
 * Creates a test application instance for testing
 */
export const createTestApp = async (
  module: TestingModule
): Promise<INestApplication> => {
  const app = module.createNestApplication();

  // Configure test app settings
  app.useLogger(false); // Disable logging in tests

  return app;
};

/**
 * Creates a testing module with common providers
 */
export const createTestingModule = (
  imports: (
    | Type<any>
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardReference<any>
  )[],
  providers: Provider[] = []
): Promise<TestingModule> => {
  return Test.createTestingModule({
    imports,
    providers,
  }).compile();
};

/**
 * Mock MultiTenantPrismaService for testing
 * Provides comprehensive mock implementations for all service methods
 */
export const createMockMultiTenantPrismaService = (overrides = {}) => {
  const defaultMock = {
    // Projects
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Milestones
    milestone: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Files
    file: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Approvals
    approval: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Tickets
    ticket: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Invoices
    invoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Users
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    // Tasks
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Organization
    organization: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // Membership
    membership: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock bcrypt functions
 */
export const createMockBcrypt = (overrides = {}) => {
  const defaultMock = {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
    genSalt: vi.fn().mockResolvedValue('salt'),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock nodemailer transporter
 */
export const createMockTransporter = (overrides = {}) => {
  const defaultMock = {
    sendMail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK',
    }),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock ConfigService
 */
export const createMockConfigService = (overrides = {}) => {
  const defaultMock = {
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
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock JwtService
 */
export const createMockJwtService = (overrides = {}) => {
  const defaultMock = {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi
      .fn()
      .mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
    verifyAsync: vi
      .fn()
      .mockResolvedValue({ userId: 'test-user-id', email: 'test@example.com' }),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock CacheManager
 */
export const createMockCacheManager = (overrides = {}) => {
  const defaultMock = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    reset: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Create mock request object with organization context
 */
export const createMockRequest = (overrides = {}) => {
  const defaultMock = {
    organizationId: 'test-org-id',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      profilePicture: null,
    },
    headers: {},
    query: {},
    body: {},
    params: {},
    method: 'GET',
    url: '/test',
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock Response object for interceptors and controllers
 */
export const createMockResponse = (overrides = {}) => {
  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    get: vi.fn(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    locals: {},
    headers: {},
    ...overrides,
  };

  return mockResponse;
};

/**
 * Mock ExecutionContext for guards and interceptors
 */
export const createMockExecutionContext = (overrides = {}) => {
  const mockRequest = createMockRequest();
  const mockResponse = createMockResponse();

  const defaultMock = {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(mockRequest),
      getResponse: vi.fn().mockReturnValue(mockResponse),
    }),
    getHandler: vi.fn().mockReturnValue(() => {}),
    getClass: vi.fn().mockReturnValue(class TestClass {}),
    getArgs: vi.fn().mockReturnValue([mockRequest, mockResponse]),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Mock CallHandler for interceptors
 */
export const createMockCallHandler = (overrides = {}) => {
  const defaultMock = {
    handle: vi.fn().mockImplementation(() => ({
      pipe: vi.fn().mockReturnValue({
        toPromise: vi.fn().mockResolvedValue({ data: 'test' }),
      }),
    })),
  };

  return { ...defaultMock, ...overrides };
};

/**
 * Common test utilities
 */
export const TestUtils = {
  /**
   * Generate test user data
   */
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    organizationId: 'test-org-id',
    name: 'Test User',
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test organization data
   */
  createTestOrganization: (overrides = {}) => ({
    id: 'test-org-id',
    name: 'Test Organization',
    slug: 'test-org',
    domain: 'test.jasaweb.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test project data
   */
  createTestProject: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    status: 'draft',
    organizationId: 'test-org-id',
    startAt: new Date(),
    dueAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test milestone data
   */
  createTestMilestone: (overrides = {}) => ({
    id: 'test-milestone-id',
    title: 'Test Milestone',
    status: 'pending',
    dueAt: new Date(),
    projectId: 'test-project-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test task data
   */
  createTestTask: (overrides = {}) => ({
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test task description',
    status: 'pending',
    assignedUser: 'test-user-id',
    createdBy: 'test-user-id',
    projectId: 'test-project-id',
    dueAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test ticket data
   */
  createTestTicket: (overrides = {}) => ({
    id: 'test-ticket-id',
    title: 'Test Ticket',
    description: 'Test ticket description',
    status: 'open',
    priority: 'medium',
    organizationId: 'test-org-id',
    createdBy: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test file data
   */
  createTestFile: (overrides = {}) => ({
    id: 'test-file-id',
    filename: 'test-file.pdf',
    folder: '/test',
    version: 1,
    size: 1024,
    checksum: 'test-checksum',
    uploadedBy: 'test-user-id',
    projectId: 'test-project-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test approval data
   */
  createTestApproval: (overrides = {}) => ({
    id: 'test-approval-id',
    itemType: 'milestone',
    itemId: 'test-milestone-id',
    status: 'pending',
    decidedBy: 'test-user-id',
    decidedAt: null,
    note: null,
    projectId: 'test-project-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate test invoice data
   */
  createTestInvoice: (overrides = {}) => ({
    id: 'test-invoice-id',
    invoiceNumber: 'INV-001',
    amount: 1000,
    currency: 'USD',
    status: 'draft',
    organizationId: 'test-org-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Reset all mocks in the test setup
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};
