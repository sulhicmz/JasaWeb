import { Test, TestingModule } from '@nestjs/testing';
import { SecurityConfigService } from '../config/security-config.service';

describe('SecurityConfigService', () => {
  let service: SecurityConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityConfigService],
    }).compile();

    service = module.get<SecurityConfigService>(SecurityConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return security configuration', () => {
    const config = service.getConfig();
    expect(config).toHaveProperty('mfa');
    expect(config).toHaveProperty('session');
    expect(config).toHaveProperty('password');
    expect(config).toHaveProperty('monitoring');
    expect(config).toHaveProperty('encryption');
    expect(config).toHaveProperty('compliance');
  });

  it('should validate MFA settings', () => {
    const mfaConfig = service.getConfig().mfa;
    expect(typeof mfaConfig.enabled).toBe('boolean');
    expect(typeof mfaConfig.requiredForAdmins).toBe('boolean');
    expect(typeof mfaConfig.issuer).toBe('string');
    expect(typeof mfaConfig.window).toBe('number');
  });

  it('should validate password policy', () => {
    const passwordConfig = service.getPasswordPolicy();
    expect(passwordConfig.minLength).toBeGreaterThanOrEqual(8);
    expect(typeof passwordConfig.requireUppercase).toBe('boolean');
    expect(typeof passwordConfig.requireLowercase).toBe('boolean');
    expect(typeof passwordConfig.requireNumbers).toBe('boolean');
    expect(typeof passwordConfig.requireSpecialChars).toBe('boolean');
  });

  it('should perform security health check', async () => {
    const healthCheck = await service.performSecurityHealthCheck();
    expect(healthCheck).toHaveProperty('status');
    expect(healthCheck).toHaveProperty('checks');
    expect(Array.isArray(healthCheck.checks)).toBe(true);

    healthCheck.checks.forEach((check) => {
      expect(check).toHaveProperty('name');
      expect(check).toHaveProperty('status');
      expect(check).toHaveProperty('message');
      expect(['pass', 'fail', 'warn']).toContain(check.status);
    });
  });

  it('should check GDPR compliance', () => {
    const isGdprEnabled = service.isGdprEnabled();
    expect(typeof isGdprEnabled).toBe('boolean');
  });

  it('should return alert thresholds', () => {
    const thresholds = service.getAlertThresholds();
    expect(thresholds).toHaveProperty('failedLoginsPerHour');
    expect(thresholds).toHaveProperty('unusualDataAccessPerHour');
    expect(thresholds).toHaveProperty('suspiciousActivityScore');

    expect(thresholds.failedLoginsPerHour).toBeGreaterThan(0);
    expect(thresholds.unusualDataAccessPerHour).toBeGreaterThan(0);
    expect(thresholds.suspiciousActivityScore).toBeGreaterThan(0);
  });
});
