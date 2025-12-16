import { validateEnvironmentVariables } from '@jasaweb/config/env-validation';

export function validateEnv(config: Record<string, unknown>) {
  // Set environment variables from config for validation
  Object.entries(config).forEach(([key, value]) => {
    // Only allow specific, safe environment variable keys
    const allowedEnvKeys = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'CORS_ORIGIN',
      'API_BASE_URL',
      'WEB_BASE_URL',
      'FRONTEND_URL',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_SECURE',
      'POSTGRES_HOST',
      'POSTGRES_PORT',
    ];

    if (
      value !== undefined &&
      typeof key === 'string' &&
      allowedEnvKeys.includes(key)
    ) {
      process.env[key] = String(value);
    }
  });

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
