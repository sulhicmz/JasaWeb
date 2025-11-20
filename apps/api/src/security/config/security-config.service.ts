import { Injectable, Logger } from '@nestjs/common';

export interface SecurityConfig {
  mfa: {
    enabled: boolean;
    requiredForAdmins: boolean;
    issuer: string;
    window: number; // TOTP window for clock drift
  };
  session: {
    maxConcurrentSessions: number;
    sessionTimeoutMinutes: number;
    absoluteTimeoutHours: number;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    alertThresholds: {
      failedLoginsPerHour: number;
      unusualDataAccessPerHour: number;
      suspiciousActivityScore: number;
    };
  };
  encryption: {
    algorithm: string;
    keyRotationDays: number;
    encryptPiiFields: boolean;
  };
  compliance: {
    gdprEnabled: boolean;
    dataRetentionDays: number;
    consentRequired: boolean;
    auditLogRetentionDays: number;
  };
}

@Injectable()
export class SecurityConfigService {
  private readonly logger = new Logger(SecurityConfigService.name);
  private readonly config: SecurityConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): SecurityConfig {
    return {
      mfa: {
        enabled: process.env.MFA_ENABLED === 'true',
        requiredForAdmins: process.env.MFA_REQUIRED_FOR_ADMINS !== 'false',
        issuer: process.env.MFA_ISSUER || 'JasaWeb',
        window: parseInt(process.env.MFA_WINDOW || '2'),
      },
      session: {
        maxConcurrentSessions: parseInt(
          process.env.MAX_CONCURRENT_SESSIONS || '3'
        ),
        sessionTimeoutMinutes: parseInt(
          process.env.SESSION_TIMEOUT_MINUTES || '30'
        ),
        absoluteTimeoutHours: parseInt(
          process.env.ABSOLUTE_TIMEOUT_HOURS || '8'
        ),
      },
      password: {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
        requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
        requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
        maxAge: parseInt(process.env.PASSWORD_MAX_AGE_DAYS || '90'),
      },
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
        skipSuccessfulRequests:
          process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
      },
      monitoring: {
        enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
        logLevel: process.env.SECURITY_LOG_LEVEL || 'info',
        alertThresholds: {
          failedLoginsPerHour: parseInt(
            process.env.ALERT_FAILED_LOGINS_PER_HOUR || '5'
          ),
          unusualDataAccessPerHour: parseInt(
            process.env.ALERT_UNUSUAL_DATA_ACCESS_PER_HOUR || '100'
          ),
          suspiciousActivityScore: parseInt(
            process.env.ALERT_SUSPICIOUS_ACTIVITY_SCORE || '70'
          ),
        },
      },
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS || '90'),
        encryptPiiFields: process.env.ENCRYPT_PII_FIELDS === 'true',
      },
      compliance: {
        gdprEnabled: process.env.GDPR_ENABLED !== 'false',
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555'), // 7 years
        consentRequired: process.env.CONSENT_REQUIRED !== 'false',
        auditLogRetentionDays: parseInt(
          process.env.AUDIT_LOG_RETENTION_DAYS || '2555'
        ), // 7 years
      },
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate MFA configuration
    if (this.config.mfa.enabled && !this.config.mfa.issuer) {
      errors.push('MFA issuer is required when MFA is enabled');
    }

    // Validate password configuration
    if (this.config.password.minLength < 8) {
      errors.push('Password minimum length should be at least 8 characters');
    }

    // Validate session configuration
    if (this.config.session.maxConcurrentSessions < 1) {
      errors.push('Maximum concurrent sessions must be at least 1');
    }

    // Validate rate limiting
    if (this.config.rateLimit.maxRequests < 1) {
      errors.push('Rate limit maximum requests must be at least 1');
    }

    // Validate encryption
    if (!this.config.encryption.algorithm) {
      errors.push('Encryption algorithm is required');
    }

    if (errors.length > 0) {
      this.logger.error('Security configuration validation failed:');
      errors.forEach((error) => this.logger.error(`- ${error}`));
      throw new Error('Invalid security configuration');
    }

    this.logger.log('Security configuration validated successfully');
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  isMfaEnabled(): boolean {
    return this.config.mfa.enabled;
  }

  isMfaRequiredForAdmins(): boolean {
    return this.config.mfa.requiredForAdmins;
  }

  getPasswordPolicy(): SecurityConfig['password'] {
    return { ...this.config.password };
  }

  getSessionConfig(): SecurityConfig['session'] {
    return { ...this.config.session };
  }

  getRateLimitConfig(): SecurityConfig['rateLimit'] {
    return { ...this.config.rateLimit };
  }

  getMonitoringConfig(): SecurityConfig['monitoring'] {
    return { ...this.config.monitoring };
  }

  getEncryptionConfig(): SecurityConfig['encryption'] {
    return { ...this.config.encryption };
  }

  getComplianceConfig(): SecurityConfig['compliance'] {
    return { ...this.config.compliance };
  }

  isGdprEnabled(): boolean {
    return this.config.compliance.gdprEnabled;
  }

  isConsentRequired(): boolean {
    return this.config.compliance.consentRequired;
  }

  getAlertThresholds(): SecurityConfig['monitoring']['alertThresholds'] {
    return { ...this.config.monitoring.alertThresholds };
  }

  // Runtime configuration updates
  updateMfaSettings(settings: Partial<SecurityConfig['mfa']>): void {
    Object.assign(this.config.mfa, settings);
    this.logger.log('MFA settings updated');
  }

  updateAlertThresholds(
    thresholds: Partial<SecurityConfig['monitoring']['alertThresholds']>
  ): void {
    Object.assign(this.config.monitoring.alertThresholds, thresholds);
    this.logger.log('Alert thresholds updated');
  }

  // Security health check
  async performSecurityHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message: string;
    }>;
  }> {
    const checks = [];

    // Check encryption key
    if (!process.env.ENCRYPTION_KEY) {
      checks.push({
        name: 'encryption_key',
        status: 'warn' as const,
        message: 'Encryption key not set, using generated key',
      });
    } else {
      checks.push({
        name: 'encryption_key',
        status: 'pass' as const,
        message: 'Encryption key is configured',
      });
    }

    // Check MFA configuration
    if (this.config.mfa.enabled) {
      checks.push({
        name: 'mfa_configuration',
        status: 'pass' as const,
        message: 'MFA is enabled and configured',
      });
    } else {
      checks.push({
        name: 'mfa_configuration',
        status: 'warn' as const,
        message: 'MFA is disabled',
      });
    }

    // Check monitoring
    if (this.config.monitoring.enabled) {
      checks.push({
        name: 'security_monitoring',
        status: 'pass' as const,
        message: 'Security monitoring is enabled',
      });
    } else {
      checks.push({
        name: 'security_monitoring',
        status: 'fail' as const,
        message: 'Security monitoring is disabled',
      });
    }

    // Check compliance
    if (this.config.compliance.gdprEnabled) {
      checks.push({
        name: 'gdpr_compliance',
        status: 'pass' as const,
        message: 'GDPR compliance features are enabled',
      });
    } else {
      checks.push({
        name: 'gdpr_compliance',
        status: 'warn' as const,
        message: 'GDPR compliance features are disabled',
      });
    }

    const failedChecks = checks.filter((check) => check.status === 'fail');
    const warningChecks = checks.filter((check) => check.status === 'warn');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failedChecks.length > 0) {
      status = 'critical';
    } else if (warningChecks.length > 0) {
      status = 'warning';
    }

    return { status, checks };
  }
}
