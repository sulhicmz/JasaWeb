import { Test, TestingModule } from '@nestjs/testing';
import { SecurityConfigurationService } from './security-configuration.service';
import { AppConfigService } from '../config/app.config.service';

describe('SecurityConfigurationService', () => {
  let service: SecurityConfigurationService;
  let mockAppConfigService: jest.Mocked<AppConfigService>;

  beforeEach(async () => {
    mockAppConfigService = {
      isProduction: jest.fn(),
      isDevelopment: jest.fn(),
      getCorsOrigins: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityConfigurationService,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    service = module.get<SecurityConfigurationService>(
      SecurityConfigurationService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCSPConfig', () => {
    it('should return production CSP config', () => {
      mockAppConfigService.isProduction.mockReturnValue(true);
      mockAppConfigService.isDevelopment.mockReturnValue(false);

      const cspConfig = service.getCSPConfig();

      expect(cspConfig.directives.defaultSrc).toEqual(["'self'"]);
      expect(cspConfig.directives.scriptSrc).not.toContain("'unsafe-eval'");
      expect(cspConfig.reportOnly).toBe(false);
      expect(cspConfig.directives.upgradeInsecureRequests).toBeDefined();
    });

    it('should return development CSP config', () => {
      mockAppConfigService.isProduction.mockReturnValue(false);
      mockAppConfigService.isDevelopment.mockReturnValue(true);

      const cspConfig = service.getCSPConfig();

      expect(cspConfig.directives.scriptSrc).toContain("'unsafe-eval'");
      expect(cspConfig.reportOnly).toBe(true);
      expect(cspConfig.directives.upgradeInsecureRequests).toBeUndefined();
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return production rate limit config', () => {
      mockAppConfigService.isProduction.mockReturnValue(true);

      const rateLimitConfig = service.getRateLimitConfig();

      expect(rateLimitConfig.max).toBe(100);
      expect(rateLimitConfig.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfig.message).toHaveProperty('error');
      expect(rateLimitConfig.message).toHaveProperty('statusCode');
    });

    it('should return development rate limit config', () => {
      mockAppConfigService.isProduction.mockReturnValue(false);

      const rateLimitConfig = service.getRateLimitConfig();

      expect(rateLimitConfig.max).toBe(1000);
    });
  });

  describe('getCORSConfig', () => {
    it('should return CORS config with allowed origins', () => {
      const testOrigins = ['https://example.com', 'https://app.example.com'];
      mockAppConfigService.getCorsOrigins.mockReturnValue(testOrigins);
      mockAppConfigService.isProduction.mockReturnValue(true);

      const corsConfig = service.getCORSConfig();

      expect(corsConfig.origin).toEqual(testOrigins);
      expect(corsConfig.credentials).toBe(true);
      expect(corsConfig.maxAge).toBe(86400);
      expect(corsConfig.methods).toContain('GET');
      expect(corsConfig.methods).toContain('POST');
      expect(corsConfig.allowedHeaders).toContain('X-Tenant-ID');
    });
  });

  describe('getAdditionalSecurityHeaders', () => {
    it('should return security headers appropriate for production', () => {
      mockAppConfigService.isProduction.mockReturnValue(true);

      const headers = service.getAdditionalSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Strict-Transport-Security']).toContain(
        'max-age=31536000'
      );
      expect(headers['Cross-Origin-Embedder-Policy']).toBe('require-corp');
    });

    it('should return security headers appropriate for development', () => {
      mockAppConfigService.isProduction.mockReturnValue(false);

      const headers = service.getAdditionalSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBe('max-age=0');
      expect(headers['Cross-Origin-Embedder-Policy']).toBe('unsafe-none');
    });
  });

  describe('validateRequestOrigin', () => {
    it('should allow valid origins', () => {
      const testOrigins = ['https://example.com', 'https://app.example.com'];
      mockAppConfigService.getCorsOrigins.mockReturnValue(testOrigins);

      const result = service.validateRequestOrigin('https://example.com');

      expect(result).toBe(true);
    });

    it('should reject invalid origins', () => {
      const testOrigins = ['https://example.com'];
      mockAppConfigService.getCorsOrigins.mockReturnValue(testOrigins);

      const result = service.validateRequestOrigin('https://malicious.com');

      expect(result).toBe(false);
    });

    it('should allow wildcard origin (with warning)', () => {
      const testOrigins = ['*'];
      mockAppConfigService.getCorsOrigins.mockReturnValue(testOrigins);

      const result = service.validateRequestOrigin('https://any-origin.com');

      expect(result).toBe(true);
    });
  });

  describe('getCompleteSecurityConfig', () => {
    it('should return complete security configuration', () => {
      mockAppConfigService.isProduction.mockReturnValue(true);
      mockAppConfigService.getCorsOrigins.mockReturnValue([
        'https://example.com',
      ]);

      const config = service.getCompleteSecurityConfig();

      expect(config).toHaveProperty('csp');
      expect(config).toHaveProperty('rateLimit');
      expect(config).toHaveProperty('cors');
      expect(config).toHaveProperty('additionalHeaders');
      expect(config.csp.directives).toBeDefined();
      expect(config.additionalHeaders).toBeDefined();
    });
  });
});
