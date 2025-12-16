/**
 * Configuration validation utilities
 * Ensures all required environment variables and configuration values are present
 */

import { config } from './index';

export interface ConfigValidationError {
  path: string;
  message: string;
  value?: any;
}

export function validateConfig(): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Validate API configuration
  if (!config.api.baseUrl) {
    errors.push({
      path: 'api.baseUrl',
      message: 'API base URL is required',
      value: config.api.baseUrl,
    });
  }

  // Validate critical URLs
  try {
    new URL(config.api.baseUrl);
  } catch {
    errors.push({
      path: 'api.baseUrl',
      message: 'API base URL must be a valid URL',
      value: config.api.baseUrl,
    });
  }

  // Validate timeout values
  if (config.api.requestTimeout <= 0) {
    errors.push({
      path: 'api.requestTimeout',
      message: 'Request timeout must be positive',
      value: config.api.requestTimeout,
    });
  }

  // Validate business configuration
  if (!config.business.currency.symbol) {
    errors.push({
      path: 'business.currency.symbol',
      message: 'Currency symbol is required',
      value: config.business.currency.symbol,
    });
  }

  if (!config.business.currency.locale) {
    errors.push({
      path: 'business.currency.locale',
      message: 'Currency locale is required',
      value: config.business.currency.locale,
    });
  }

  return errors;
}

export function logConfigErrors(errors: ConfigValidationError[]): void {
  if (errors.length === 0) return;

  console.group('Configuration Validation Errors');
  errors.forEach((error) => {
    console.error(`❌ ${error.path}: ${error.message}`, error.value);
  });
  console.groupEnd();

  if (config.environment.isDevelopment) {
    console.warn(
      `${errors.length} configuration error(s) found. ` +
        'Please check your environment variables and configuration.'
    );
  }
}

// Auto-validate config in development
if (config.environment.isDevelopment) {
  const errors = validateConfig();
  if (errors.length > 0) {
    logConfigErrors(errors);
  }
}
