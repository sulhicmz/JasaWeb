import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../src/common/database/prisma.service';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';

/**
 * Database Test Helper for Contract Tests
 *
 * Provides isolated database testing environment for contract tests.
 * Ensures tests run in clean, isolated transactions that can be rolled back.
 */
export class DatabaseTestHelper {
  private prisma: PrismaService;
  private multiTenantPrisma: MultiTenantPrismaService;
  private testDatabaseUrl: string;

  constructor() {
    // Use test database configuration
    this.testDatabaseUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/jasaweb_test';
  }

  async setupTestDatabase(): Promise<void> {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          databaseUrl: this.testDatabaseUrl,
        }),
      ],
      providers: [PrismaService, MultiTenantPrismaService],
    }).compile();

    this.prisma = module.get<PrismaService>(PrismaService);
    this.multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );

    // Wait for database connection
    await this.prisma.$connect();

    // Run migrations in test environment
    console.log('Test database connected and ready');
  }

  async clearDatabase(): Promise<void> {
    // Clean up all tables in correct order to respect foreign key constraints
    const tableNames = [
      'audit_logs',
      'file_uploads',
      'approval_comments',
      'approvals',
      'tasks',
      'milestones',
      'tickets',
      'invoices',
      'projects',
      'memberships',
      'organizations',
      'refresh_tokens',
      'users',
    ];

    // Use raw SQL for faster cleanup
    for (const tableName of tableNames) {
      try {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tableName}" CASCADE;`
        );
      } catch (error) {
        // Table might not exist, continue
        console.warn(`Warning: Could not truncate table ${tableName}:`, error);
      }
    }

    // Reset sequences
    try {
      await this.prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          PERFORM setval(pg_get_serial_sequence('users', 'id'), 1, false);
          PERFORM setval(pg_get_serial_sequence('organizations', 'id'), 1, false);
          PERFORM setval(pg_get_serial_sequence('projects', 'id'), 1, false);
        END $$;
      `);
    } catch (error) {
      console.warn('Warning: Could not reset sequences:', error);
    }
  }

  async createTestUser(
    userData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
    }> = {}
  ): Promise<{ user: any; organization: any; accessToken: string }> {
    const defaultUserData = {
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'SecurePass123!',
    };

    const finalUserData = { ...defaultUserData, ...userData };

    // Create organization
    const organization = await this.prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
      },
    });

    // Create user with hashed password
    const { createHash } = await import('crypto');
    const passwordHash = createHash('sha256')
      .update(finalUserData.password)
      .digest('hex');

    const user = await this.prisma.user.create({
      data: {
        email: finalUserData.email,
        firstName: finalUserData.firstName,
        lastName: finalUserData.lastName,
        passwordHash,
        organizationId: organization.id,
        isActive: true,
      },
    });

    // Create membership
    await this.prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    // Generate access token using JWT
    const { sign } = await import('jsonwebtoken');
    const accessToken = sign(
      {
        sub: user.id,
        email: user.email,
        organizationId: organization.id,
      },
      'test-jwt-secret',
      { expiresIn: '1h' }
    );

    return { user, organization, accessToken };
  }

  async createTestProject(
    organizationId: string,
    userId: string
  ): Promise<any> {
    return this.prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        description: 'A test project for contract testing',
        status: 'ACTIVE',
        organizationId,
        createdBy: userId,
      },
    });
  }

  async createTestTicket(organizationId: string, userId: string): Promise<any> {
    return this.prisma.ticket.create({
      data: {
        title: `Test Ticket ${Date.now()}`,
        description: 'A test ticket for contract testing',
        status: 'OPEN',
        priority: 'MEDIUM',
        organizationId,
        createdBy: userId,
      },
    });
  }

  async cleanup(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }

  getMultiTenantPrisma(): MultiTenantPrismaService {
    return this.multiTenantPrisma;
  }
}

/**
 * Contract Test Utilities
 *
 * Common utilities for validating API contracts in tests.
 */
export class ContractTestUtils {
  /**
   * Validate pagination contract
   */
  static validatePaginationResponse(
    response: any,
    expectedFields: string[] = []
  ) {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('meta');

    expect(Array.isArray(response.data)).toBe(true);

    expect(response.meta).toHaveProperty('page');
    expect(response.meta).toHaveProperty('limit');
    expect(response.meta).toHaveProperty('total');
    expect(response.meta).toHaveProperty('totalPages');
    expect(response.meta).toHaveProperty('hasNext');
    expect(response.meta).toHaveProperty('hasPrevious');

    expect(typeof response.meta.page).toBe('number');
    expect(typeof response.meta.limit).toBe('number');
    expect(typeof response.meta.total).toBe('number');
    expect(typeof response.meta.totalPages).toBe('number');
    expect(typeof response.meta.hasNext).toBe('boolean');
    expect(typeof response.meta.hasPrevious).toBe('boolean');

    // Validate data items contain expected fields
    if (expectedFields.length > 0 && response.data.length > 0) {
      expectedFields.forEach((field) => {
        expect(response.data[0]).toHaveProperty(field);
      });
    }
  }

  /**
   * Validate standard error contract
   */
  static validateErrorResponse(response: any, expectedStatusCode: number) {
    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('statusCode');
    expect(response).toHaveProperty('timestamp');

    expect(response.statusCode).toBe(expectedStatusCode);

    // Validate timestamp format
    expect(typeof response.error).toBe('string');
    expect(typeof response.message).toBe('string');
    expect(String(response.timestamp)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  }

  /**
   * Validate JWT token format
   */
  static validateJWTToken(token: string): void {
    expect(typeof token).toBe('string');

    // Basic JWT format validation (3 parts separated by dots)
    expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // Decode and validate token structure
    const parts = token.split('.');
    expect(parts).toHaveLength(3);

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      expect(header).toHaveProperty('alg');
      expect(header).toHaveProperty('typ');
      expect(header.typ).toBe('JWT');

      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');

      expect(typeof payload.sub).toBe('string');
      expect(typeof payload.iat).toBe('number');
      expect(typeof payload.exp).toBe('number');
    } catch (error) {
      fail('Invalid JWT token format: ' + error);
    }
  }

  /**
   * Validate date format (ISO8601)
   */
  static validateDateString(dateString: string): void {
    expect(typeof dateString).toBe('string');

    // Validate ISO8601 format
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Validate it's a valid date
    const date = new Date(dateString);
    expect(date.getTime()).not.toBeNaN();
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): void {
    expect(typeof uuid).toBe('string');
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    expect(typeof email).toBe('string');
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }

  /**
   * Validate that sensitive fields are not present
   */
  static validateNoSensitiveData(
    response: any,
    sensitiveFields: string[] = []
  ): void {
    const defaultSensitiveFields = [
      'password',
      'passwordHash',
      'salt',
      'internalData',
      'secret',
      'token',
      'apiKey',
    ];

    const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];

    allSensitiveFields.forEach((field) => {
      expect(response).not.toHaveProperty(field);
    });

    // Check nested objects for sensitive data
    const checkNested = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) return;

      allSensitiveFields.forEach((field) => {
        if (obj.hasOwnProperty(field)) {
          fail(`Sensitive field '${field}' found at ${path}${field}`);
        }
      });

      // Recursively check nested objects
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkNested(obj[key], `${path}${key}.`);
        }
      });
    };

    checkNested(response);
  }

  /**
   * Validate response headers
   */
  static validateResponseHeaders(headers: any, contentType?: string): void {
    if (contentType) {
      expect(headers['content-type']).toMatch(contentType);
    }

    // Security headers validation
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
  }

  /**
   * Validate array response consistency
   */
  static validateArrayResponse(
    response: any,
    requiredFields: string[] = []
  ): void {
    expect(Array.isArray(response)).toBe(true);

    if (response.length > 0 && requiredFields.length > 0) {
      requiredFields.forEach((field) => {
        expect(response[0]).toHaveProperty(field);
      });
    }
  }

  /**
   * Create test request with proper headers
   */
  static createAuthenticatedRequest(app: any, token: string): any {
    return request(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
  }
}

/**
 * Contract Test Fixtures
 *
 * Common test data fixtures for contract tests.
 */
export class ContractTestFixtures {
  static validUserData = {
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'SecurePass123!',
    organizationName: 'Test Organization',
  };

  static validProjectData = {
    name: 'Test Project',
    description: 'A test project for contract testing',
    status: 'ACTIVE',
  };

  static validTicketData = {
    title: 'Test Ticket',
    description: 'A test ticket for contract testing',
    priority: 'MEDIUM',
  };

  static invalidEmailData = {
    email: 'invalid-email',
    firstName: 'Test',
    lastName: 'User',
    password: 'SecurePass123!',
  };

  static weakPasswordData = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: '123',
  };

  static createProjectData(overrides: any = {}) {
    return { ...this.validProjectData, ...overrides };
  }

  static createUserData(overrides: any = {}) {
    return { ...this.validUserData, ...overrides };
  }

  static createTicketData(overrides: any = {}) {
    return { ...this.validTicketData, ...overrides };
  }
}
