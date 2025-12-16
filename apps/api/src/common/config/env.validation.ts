import {
  validateEnvironmentVariables,
  ENV_SCHEMA,
} from '@jasaweb/config/env-validation';

export function validateEnv(config: Record<string, unknown>) {
  // Create a whitelist of allowed environment variable keys
  const ALLOWED_ENV_KEYS = new Set(Object.keys(ENV_SCHEMA));

  // Set environment variables from config for validation with security checks
  Object.entries(config).forEach(([key, value]) => {
    // Security checks to prevent prototype pollution and injection
    if (
      value !== undefined &&
      typeof key === 'string' &&
      // Only allow whitelisted environment variable keys
      ALLOWED_ENV_KEYS.has(key) &&
      // Prevent prototype pollution attacks
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      // Ensure key follows proper environment variable naming conventions
      /^[A-Z_][A-Z0-9_]*$/.test(key) &&
      // Prevent path-like strings that could cause issues
      !key.includes('..') &&
      !key.includes('/') &&
      !key.includes('\\')
    ) {
      // Type-safe environment variable assignment
      const secureValue: string =
        typeof value === 'string'
          ? value
          : typeof value === 'number'
            ? value.toString()
            : typeof value === 'boolean'
              ? value
                ? 'true'
                : 'false'
              : JSON.stringify(value);

      process.env[key] = secureValue;
    }
  });

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
