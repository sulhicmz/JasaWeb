import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from './app.config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct API base URL', () => {
    expect(service.getApiBaseUrl).toBeDefined();
    expect(typeof service.getApiBaseUrl).toBe('string');
  });

  it('should return correct CORS origins', () => {
    const origins = service.getCorsOrigins;
    expect(Array.isArray(origins)).toBe(true);
    expect(origins.length).toBeGreaterThan(0);
  });

  it('should detect development environment', () => {
    expect(typeof service.isDevelopment()).toBe('boolean');
  });

  it('should build full API URLs correctly', () => {
    const testUrl = service.getApiUrl('/test');
    expect(testUrl).toContain('/test');
    expect(testUrl).not.toContain('//test');
  });

  it('should validate allowed origins', () => {
    const origins = service.getCorsOrigins;
    if (origins.length > 0) {
      expect(service.isOriginAllowed(origins[0]!)).toBe(true);
    }
    expect(service.isOriginAllowed('https://malicious-site.com')).toBe(false);
  });
});
