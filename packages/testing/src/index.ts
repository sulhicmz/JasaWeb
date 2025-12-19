// Testing utilities and helpers for JasaWeb
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Type,
  DynamicModule,
  ForwardReference,
  Provider,
} from '@nestjs/common';

// Export Vitest configurations
export {
  baseVitestConfig,
  apiVitestConfig,
  webVitestConfig,
  packageVitestConfig,
} from './vitest.base.config';

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
    ...overrides,
  }),

  /**
   * Generate test organization data
   */
  createTestOrganization: (overrides = {}) => ({
    id: 'test-org-id',
    name: 'Test Organization',
    domain: 'test.jasaweb.com',
    ...overrides,
  }),
};
