/**
 * Environment variable validation utilities
 * These utilities help validate and parse environment variables with proper type safety
 */

/**
 * Gets a required environment variable, throws an error if not found
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is missing or empty`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : defaultValue;
}

/**
 * Gets an environment variable as a number with a default value
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(
      `Environment variable ${key} must be a valid number, got: ${value}`
    );
  }

  return parsed;
}

/**
 * Gets an environment variable as a boolean with a default value
 */
export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

/**
 * Gets an environment variable as a URL with validation
 */
export function getEnvUrl(
  key: string,
  required: boolean = true
): URL | undefined {
  const value = process.env[key];
  if (!value || value === '') {
    if (required) {
      throw new Error(
        `Required environment variable ${key} is missing or empty`
      );
    }
    return undefined;
  }

  try {
    return new URL(value);
  } catch (error) {
    throw new Error(
      `Environment variable ${key} must be a valid URL, got: ${value}`
    );
  }
}

/**
 * Gets an environment variable as a comma-separated list
 */
export function getEnvArray(key: string, required: boolean = false): string[] {
  const value = process.env[key];
  if (!value || value === '') {
    if (required) {
      throw new Error(
        `Required environment variable ${key} is missing or empty`
      );
    }
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets environment variable as email with validation
 */
export function getEnvEmail(
  key: string,
  required: boolean = true
): string | undefined {
  const value = process.env[key];
  if (!value || value === '') {
    if (required) {
      throw new Error(
        `Required environment variable ${key} is missing or empty`
      );
    }
    return undefined;
  }

  if (!validateEmail(value)) {
    throw new Error(
      `Environment variable ${key} must be a valid email address, got: ${value}`
    );
  }

  return value;
}

/**
 * Gets environment variable with minimum value validation
 */
export function getEnvNumberMin(
  key: string,
  defaultValue: number,
  min: number
): number {
  const value = getEnvNumber(key, defaultValue);
  if (value < min) {
    throw new Error(
      `Environment variable ${key} must be at least ${min}, got: ${value}`
    );
  }
  return value;
}

/**
 * Generates a cryptographically secure random string
 */
export function generateSecureSecret(length: number = 32): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
      if (values[i] !== undefined) {
        result += charset[values[i]! % charset.length];
      }
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  return result;
}
