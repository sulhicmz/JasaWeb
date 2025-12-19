/**
 * Test Environment Configuration Helper
 * Provides dynamic test environment configuration for consistent testing
 */

export interface TestEnvironmentConfig {
  nodeEnv: string;
  isTest: boolean;
  databaseUrl: string;
  redisUrl?: string;
  redisHost: string;
  apiBaseUrl: string;
  webBaseUrl: string;
  corsOrigins: string[];
  apiPort: number;
  webPort: number;
}

export class TestConfigHelper {
  private static readonly TEST_CONFIG: TestEnvironmentConfig = {
    nodeEnv: 'test',
    isTest: true,
    databaseUrl: 'postgresql://test:test@localhost:5432/testdb',
    redisUrl: undefined,
    redisHost: 'localhost',
    apiBaseUrl: 'http://localhost:3000',
    webBaseUrl: 'http://localhost:4321',
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:4321',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4321',
    ],
    apiPort: 3000,
    webPort: 4321,
  };

  /**
   * Get test environment configuration
   */
  static getTestConfig(): TestEnvironmentConfig {
    return { ...this.TEST_CONFIG };
  }

  /**
   * Set up test environment variables
   */
  static setupTestEnvironment(): void {
    const config = this.getTestConfig();

    // Set environment variables for tests
    process.env.NODE_ENV = config.nodeEnv;
    process.env.DATABASE_URL = config.databaseUrl;
    process.env.REDIS_HOST = config.redisHost;

    if (config.redisUrl) {
      process.env.REDIS_URL = config.redisUrl;
    }

    process.env.API_BASE_URL = config.apiBaseUrl;
    process.env.WEB_BASE_URL = config.webBaseUrl;
    process.env.CORS_ORIGIN = config.corsOrigins.join(',');
    process.env.API_PORT = config.apiPort.toString();
    process.env.WEB_PORT = config.webPort.toString();

    // Set test-specific configurations
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32';
    process.env.SESSION_SECRET = 'test-session-secret-32-chars';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars';

    // Disable external services in tests
    process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
    process.env.SMTP_HOST = 'localhost';
    process.env.STORAGE_TYPE = 'local';
    process.env.UPLOAD_DIR = '/tmp/test-uploads';
  }

  /**
   * Clean up test environment variables
   */
  static cleanupTestEnvironment(): void {
    const testVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'REDIS_HOST',
      'API_BASE_URL',
      'WEB_BASE_URL',
      'CORS_ORIGIN',
      'API_PORT',
      'WEB_PORT',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'ENABLE_EMAIL_NOTIFICATIONS',
      'SMTP_HOST',
      'STORAGE_TYPE',
      'UPLOAD_DIR',
    ];

    testVars.forEach((varName) => {
      delete process.env[varName];
    });
  }

  /**
   * Create mock configuration service
   */
  static createMockConfigService() {
    const config = this.getTestConfig();

    return {
      get: (key: string) => {
        switch (key) {
          case 'NODE_ENV':
            return config.nodeEnv;
          case 'DATABASE_URL':
            return config.databaseUrl;
          case 'REDIS_HOST':
            return config.redisHost;
          case 'API_BASE_URL':
            return config.apiBaseUrl;
          case 'WEB_BASE_URL':
            return config.webBaseUrl;
          case 'CORS_ORIGIN':
            return config.corsOrigins.join(',');
          case 'API_PORT':
            return config.apiPort;
          case 'WEB_PORT':
            return config.webPort;
          case 'JWT_SECRET':
            return 'test-jwt-secret-32-chars-long';
          case 'JWT_REFRESH_SECRET':
            return 'test-jwt-refresh-secret-32';
          case 'SESSION_SECRET':
            return 'test-session-secret-32-chars';
          case 'ENCRYPTION_KEY':
            return 'test-encryption-key-32-chars';
          case 'SMTP_HOST':
            return 'localhost';
          case 'STORAGE_TYPE':
            return 'local';
          case 'UPLOAD_DIR':
            return '/tmp/test-uploads';
          default:
            return undefined;
        }
      },
      getPort: (key: string) => {
        switch (key) {
          case 'API_PORT':
            return config.apiPort;
          case 'WEB_PORT':
            return config.webPort;
          default:
            return 3000;
        }
      },
      getString: (key: string) => {
        switch (key) {
          case 'NODE_ENV':
            return config.nodeEnv;
          case 'DATABASE_URL':
            return config.databaseUrl;
          case 'REDIS_HOST':
            return config.redisHost;
          case 'API_BASE_URL':
            return config.apiBaseUrl;
          case 'WEB_BASE_URL':
            return config.webBaseUrl;
          default:
            return undefined;
        }
      },
      getBoolean: (key: string) => {
        const mockService = this.createMockConfigService();
        const value = mockService.getString(key);
        return value === 'true';
      },
      getNumber: (key: string) => {
        const mockService = this.createMockConfigService();
        const value = mockService.get(key);
        return typeof value === 'string' ? parseInt(value, 10) : value;
      },
    };
  }

  /**
   * Environment-specific test configuration
   */
  static getEnvironmentSpecificConfig(
    env: 'ci' | 'local' | 'docker'
  ): Partial<TestEnvironmentConfig> {
    switch (env) {
      case 'ci':
        return {
          databaseUrl: 'postgresql://postgres:postgres@localhost:5432/testdb',
          redisHost: 'localhost',
          apiBaseUrl: 'http://localhost:3000',
          webBaseUrl: 'http://localhost:4321',
        };
      case 'docker':
        return {
          databaseUrl: 'postgresql://postgres:password@db:5432/testdb',
          redisHost: 'redis',
          redisUrl: 'redis://redis:6379',
          apiBaseUrl: 'http://api:3000',
          webBaseUrl: 'http://web:4321',
        };
      case 'local':
      default:
        return this.getTestConfig();
    }
  }
}
