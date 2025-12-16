/**
 * Configuration validation utilities for API
 * Ensures all required environment variables and configuration values are present
 */

import { config } from './index';

export interface ConfigValidationError {
  path: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

export function validateConfig(): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Validate API configuration
  if (config.api.port <= 0 || config.api.port > 65535) {
    errors.push({
      path: 'api.port',
      message: 'API port must be between 1 and 65535',
      value: config.api.port,
      severity: 'error',
    });
  }

  // Validate database configuration
  if (!config.database.host) {
    errors.push({
      path: 'database.host',
      message: 'Database host is required',
      value: config.database.host,
      severity: 'error',
    });
  }

  if (config.database.port <= 0 || config.database.port > 65535) {
    errors.push({
      path: 'database.port',
      message: 'Database port must be between 1 and 65535',
      value: config.database.port,
      severity: 'error',
    });
  }

  if (!config.database.username) {
    errors.push({
      path: 'database.username',
      message: 'Database username is required',
      value: config.database.username,
      severity: 'error',
    });
  }

  if (!config.database.name) {
    errors.push({
      path: 'database.name',
      message: 'Database name is required',
      value: config.database.name,
      severity: 'error',
    });
  }

  // Validate security configuration
  if (config.security.jwt.secret.length < config.security.jwt.secretMinLength) {
    errors.push({
      path: 'security.jwt.secret',
      message: `JWT secret must be at least ${config.security.jwt.secretMinLength} characters long`,
      value: `Length: ${config.security.jwt.secret.length}`,
      severity: 'error',
    });
  }

  if (config.security.password.bcryptRounds < 10) {
    errors.push({
      path: 'security.password.bcryptRounds',
      message: 'Bcrypt rounds should be at least 10 for security',
      value: config.security.password.bcryptRounds,
      severity: 'warning',
    });
  }

  // Validate storage configuration
  if (config.storage.maxFileSize <= 0) {
    errors.push({
      path: 'storage.maxFileSize',
      message: 'Max file size must be positive',
      value: config.storage.maxFileSize,
      severity: 'error',
    });
  }

  if (config.storage.allowedMimeTypes.length === 0) {
    errors.push({
      path: 'storage.allowedMimeTypes',
      message: 'At least one MIME type must be allowed',
      value: config.storage.allowedMimeTypes,
      severity: 'error',
    });
  }

  // Validate email configuration
  if (config.environment.features.emailNotifications) {
    if (config.email.provider === 'resend' && !config.email.resend.apiKey) {
      errors.push({
        path: 'email.resend.apiKey',
        message:
          'Resend API key is required when email notifications are enabled',
        value: config.email.resend.apiKey,
        severity: 'error',
      });
    }

    if (config.email.provider === 'smtp' && !config.email.smtp.auth.user) {
      errors.push({
        path: 'email.smtp.auth.user',
        message: 'SMTP username is required when using SMTP provider',
        value: config.email.smtp.auth.user,
        severity: 'error',
      });
    }
  }

  // Validate cache configuration
  if (
    config.cache.redis.host &&
    (config.cache.redis.port <= 0 || config.cache.redis.port > 65535)
  ) {
    errors.push({
      path: 'cache.redis.port',
      message: 'Redis port must be between 1 and 65535',
      value: config.cache.redis.port,
      severity: 'error',
    });
  }

  // Validate business configuration
  if (config.business.sla.responseTimes.critical <= 0) {
    errors.push({
      path: 'business.sla.responseTimes.critical',
      message: 'Critical SLA response time must be positive',
      value: config.business.sla.responseTimes.critical,
      severity: 'error',
    });
  }

  // Environment-specific validations
  if (config.environment.isProduction) {
    if (
      config.security.jwt.secret === 'your-super-secret-jwt-key' ||
      config.security.jwt.secret.length < 32
    ) {
      errors.push({
        path: 'security.jwt.secret',
        message: 'Production requires a strong JWT secret',
        severity: 'error',
      });
    }

    if (config.database.password === 'password') {
      errors.push({
        path: 'database.password',
        message: 'Production requires a secure database password',
        severity: 'error',
      });
    }

    if (!config.security.csp.enabled) {
      errors.push({
        path: 'security.csp.enabled',
        message: 'CSP should be enabled in production',
        severity: 'warning',
      });
    }
  }

  return errors;
}

export function logConfigErrors(errors: ConfigValidationError[]): void {
  if (errors.length === 0) {
    console.log('✅ All configuration values are valid');
    return;
  }

  console.group('Configuration Validation Issues');

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  if (errorCount > 0) {
    console.error(`🚫 ${errorCount} configuration error(s) found:`);
    errors
      .filter((e) => e.severity === 'error')
      .forEach((error) => {
        console.error(`❌ ${error.path}: ${error.message}`, error.value);
      });
  }

  if (warningCount > 0) {
    console.warn(`⚠️  ${warningCount} configuration warning(s) found:`);
    errors
      .filter((e) => e.severity === 'warning')
      .forEach((warning) => {
        console.warn(`⚠️  ${warning.path}: ${warning.message}`, warning.value);
      });
  }

  console.groupEnd();

  if (errorCount > 0 && config.environment.isProduction) {
    throw new Error(
      'Configuration validation failed in production. Cannot start server.'
    );
  }

  if (config.environment.debug) {
    console.warn(
      `Configuration validation completed with ${errorCount} error(s) and ${warningCount} warning(s). ` +
        'Please check your environment variables and configuration.'
    );
  }
}

// Validate configuration on import
const errors = validateConfig();
if (errors.length > 0) {
  logConfigErrors(errors);
}
