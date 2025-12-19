/**
 * URL Configuration Tests
 * Tests for dynamic URL configuration to ensure environment-aware behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  urlConfig,
  getApiUrl,
  getWebUrl,
  getCdnUrl,
  getWebSocketUrl,
  getAllowedOrigins,
} from './src/url-config';

describe('URL Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return localhost API URL in development', () => {
      const apiUrl = getApiUrl();
      expect(apiUrl).toBe('http://localhost:3000');
    });

    it('should return localhost web URL in development', () => {
      const webUrl = getWebUrl();
      expect(webUrl).toBe('http://localhost:4321');
    });

    it('should return empty CDN URL in development', () => {
      const cdnUrl = getCdnUrl();
      expect(cdnUrl).toBe('');
    });

    it('should return WebSocket URL in development', () => {
      const wsUrl = getWebSocketUrl();
      expect(wsUrl).toBe('ws://localhost:3000');
    });

    it('should use custom development ports when configured', () => {
      process.env.DEV_API_PORT = '3001';
      process.env.DEV_WEB_PORT = '4322';
      process.env.DEV_API_HOST = '127.0.0.1';
      process.env.DEV_WEB_HOST = '127.0.0.1';

      expect(getApiUrl()).toBe('http://127.0.0.1:3001');
      expect(getWebUrl()).toBe('http://127.0.0.1:4322');
      expect(getWebSocketUrl()).toBe('ws://127.0.0.1:3001');
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should return production API URL in production', () => {
      const apiUrl = getApiUrl();
      expect(apiUrl).toBe('https://api.jasaweb.com');
    });

    it('should return production web URL in production', () => {
      const webUrl = getWebUrl();
      expect(webUrl).toBe('https://jasaweb.com');
    });

    it('should return production CDN URL in production', () => {
      const cdnUrl = getCdnUrl();
      expect(cdnUrl).toBe('https://cdn.jasaweb.com');
    });

    it('should return secure WebSocket URL in production', () => {
      const wsUrl = getWebSocketUrl();
      expect(wsUrl).toBe('wss://api.jasaweb.com');
    });

    it('should use custom production URLs when configured', () => {
      process.env.PRODUCTION_API_URL = 'https://api.example.com';
      process.env.PRODUCTION_WEB_URL = 'https://example.com';
      process.env.PRODUCTION_CDN_URL = 'https://cdn.example.com';

      expect(getApiUrl()).toBe('https://api.example.com');
      expect(getWebUrl()).toBe('https://example.com');
      expect(getCdnUrl()).toBe('https://cdn.example.com');
    });
  });

  describe('Staging Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'staging';
    });

    it('should return staging API URL in staging', () => {
      const apiUrl = getApiUrl();
      expect(apiUrl).toBe('https://api-staging.jasaweb.com');
    });

    it('should return staging web URL in staging', () => {
      const webUrl = getWebUrl();
      expect(webUrl).toBe('https://staging.jasaweb.com');
    });

    it('should return staging CDN URL in staging', () => {
      const cdnUrl = getCdnUrl();
      expect(cdnUrl).toBe('https://cdn-staging.jasaweb.com');
    });

    it('should use custom staging URLs when configured', () => {
      process.env.STAGING_API_URL = 'https://api-staging.example.com';
      process.env.STAGING_WEB_URL = 'https://staging.example.com';
      process.env.STAGING_CDN_URL = 'https://cdn-staging.example.com';

      expect(getApiUrl()).toBe('https://api-staging.example.com');
      expect(getWebUrl()).toBe('https://staging.example.com');
      expect(getCdnUrl()).toBe('https://cdn-staging.example.com');
    });
  });

  describe('Test Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should return test API URL in test environment', () => {
      expect(getApiUrl()).toBe('http://localhost:3001');
    });

    it('should return test web URL in test environment', () => {
      expect(getWebUrl()).toBe('http://localhost:4322');
    });

    it('should use custom test URLs when configured', () => {
      process.env.TEST_API_URL = 'http://api-test:3001';
      process.env.TEST_WEB_URL = 'http://web-test:4322';

      expect(getApiUrl()).toBe('http://api-test:3001');
      expect(getWebUrl()).toBe('http://web-test:4322');
    });
  });

  describe('CORS Origins', () => {
    it('should include development origins in development mode', () => {
      process.env.NODE_ENV = 'development';
      const origins = getAllowedOrigins();

      expect(origins).toContain('http://localhost:4321');
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://127.0.0.1:4321');
      expect(origins).toContain('http://127.0.0.1:3000');
    });

    it('should include production origins in production mode', () => {
      process.env.NODE_ENV = 'production';
      const origins = getAllowedOrigins();

      expect(origins).toContain('https://jasaweb.com');
      expect(origins).toContain('https://www.jasaweb.com');
      expect(origins).toContain('https://api.jasaweb.com');
    });

    it('should include staging origins when INCLUDE_STAGING_ORIGINS is true', () => {
      process.env.NODE_ENV = 'development';
      process.env.INCLUDE_STAGING_ORIGINS = 'true';
      const origins = getAllowedOrigins();

      expect(origins).toContain('https://staging.jasaweb.com');
      expect(origins).toContain('https://api-staging.jasaweb.com');
    });

    it('should include additional CORS origins when configured', () => {
      process.env.NODE_ENV = 'development';
      process.env.ADDITIONAL_CORS_ORIGINS =
        'https://example.com,https://app.example.com';
      const origins = getAllowedOrigins();

      expect(origins).toContain('https://example.com');
      expect(origins).toContain('https://app.example.com');
    });

    it('should remove duplicate origins', () => {
      process.env.NODE_ENV = 'development';
      process.env.ADDITIONAL_CORS_ORIGINS =
        'http://localhost:3000,https://example.com';
      const origins = getAllowedOrigins();

      const localhostCount = origins.filter(
        (origin: string) => origin === 'http://localhost:3000'
      ).length;
      expect(localhostCount).toBe(1);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration successful in development', () => {
      process.env.NODE_ENV = 'development';
      const validation = urlConfig.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate configuration successful in production', () => {
      process.env.NODE_ENV = 'production';
      const validation = urlConfig.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration with non-HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_API_URL = 'http://api.example.com';
      process.env.PRODUCTION_WEB_URL = 'http://example.com';

      const validation = urlConfig.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'API URL must use HTTPS in production'
      );
      expect(validation.errors).toContain(
        'Web URL must use HTTPS in production'
      );
    });

    it('should validate configuration successful with defaults', () => {
      process.env.NODE_ENV = 'production';
      const validation = urlConfig.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Configuration Access', () => {
    it('should provide all configuration for debugging', () => {
      process.env.NODE_ENV = 'development';
      const allConfig = urlConfig.getAllConfig();

      expect(allConfig).toHaveProperty('api');
      expect(allConfig).toHaveProperty('web');
      expect(allConfig).toHaveProperty('cdn');
      expect(allConfig).toHaveProperty('websocket');

      expect(allConfig.api).toHaveProperty('development');
      expect(allConfig.api).toHaveProperty('production');
      expect(allConfig.api).toHaveProperty('staging');
      expect(allConfig.api).toHaveProperty('test');
    });
  });

  describe('Default Environment Handling', () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should default to development when NODE_ENV is not set', () => {
      const apiUrl = getApiUrl();
      const webUrl = getWebUrl();

      expect(apiUrl).toBe('http://localhost:3000');
      expect(webUrl).toBe('http://localhost:4321');
    });
  });
});
