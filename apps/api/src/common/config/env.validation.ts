import { validateEnvironmentVariables } from '@jasaweb/config/env-validation';

export function validateEnv(config: Record<string, unknown>) {
  // Set environment variables from config for validation
  // Only allow specific, safe environment variable keys
  const allowedEnvKeys: ReadonlyArray<string> = [
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
  ] as const;

  const allowedEnvKeysSet = new Set(allowedEnvKeys);

  Object.entries(config).forEach(([key, value]) => {
    // Security: Object injection prevented by strict whitelist validation
    if (
      value !== undefined &&
      typeof key === 'string' &&
      /^[A-Z_][A-Z0-9_]*$/.test(key) &&
      allowedEnvKeysSet.has(key)
    ) {
      process.env[key] = String(value);
    }
  });

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
