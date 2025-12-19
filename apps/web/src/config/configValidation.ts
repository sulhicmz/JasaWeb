/**
 * Runtime Configuration Validation for Frontend
 *
 * This utility provides runtime validation and safety checks for configuration
 * to prevent deployment issues and provide better debugging information.
 */

import { getApiUrl } from './api';

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  apiUrl?: string;
  environment?: string;
}

/**
 * Validate API URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL appears to be localhost
 */
function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Get environment type
 */
function getEnvironmentType(): string {
  const mode = import.meta.env.MODE || 'development';
  return mode;
}

/**
 * Validate current configuration
 */
export function validateConfiguration(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const environment = getEnvironmentType();

  try {
    const apiUrl = getApiUrl();

    // Validate API URL format
    if (!isValidUrl(apiUrl)) {
      errors.push(`Invalid API URL format: ${apiUrl}`);
    }

    // Check for localhost URLs in production
    if (environment === 'production' && isLocalhostUrl(apiUrl)) {
      errors.push('Using localhost URL in production environment');
    }

    // Check for missing environment variables in production
    if (environment === 'production') {
      if (
        !import.meta.env.PUBLIC_API_URL &&
        !import.meta.env.PUBLIC_API_BASE_URL
      ) {
        warnings.push(
          'Production environment should set PUBLIC_API_URL or PUBLIC_API_BASE_URL'
        );
      }
    }

    // Check for hardcoded URLs (this would need to be expanded)
    if (apiUrl === 'http://localhost:3001') {
      warnings.push(
        'Potentially hardcoded API URL detected (http://localhost:3001)'
      );
    }

    // Return early if critical errors exist
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        apiUrl,
        environment,
      };
    }

    // Additional warnings
    if (environment === 'development' && !isLocalhostUrl(apiUrl)) {
      warnings.push('Using non-localhost URL in development environment');
    }

    return {
      isValid: true,
      errors,
      warnings,
      apiUrl,
      environment,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings,
      environment,
    };
  }
}

/**
 * Log configuration status (without sensitive data)
 */
export function logConfigurationStatus(): void {
  const validation = validateConfiguration();

  if (import.meta.env.DEV) {
    console.group('🔧 JasaWeb Frontend Configuration');
    console.log('Environment:', validation.environment);
    console.log('API URL:', validation.apiUrl);
    console.log('Valid:', validation.isValid);

    if (validation.errors.length > 0) {
      console.error('Errors:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('Warnings:', validation.warnings);
    }

    console.groupEnd();
  }
}

/**
 * Get safe API URL with validation
 */
export function getSafeApiUrl(): string {
  const validation = validateConfiguration();

  if (!validation.isValid) {
    console.error('Configuration validation failed:', validation.errors);
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  return validation.apiUrl || 'http://localhost:3000';
}

/**
 * Validate configuration on page load (call this in your app initialization)
 */
export function initializeConfigurationValidation(): void {
  const validation = validateConfiguration();

  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));

    // In development, show an alert
    if (import.meta.env.DEV) {
      alert(`Configuration Error:\n${validation.errors.join('\n')}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Log successful configuration
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Configuration is valid');
  }

  // Log the configuration status in development
  if (import.meta.env.DEV) {
    logConfigurationStatus();
  }
}
