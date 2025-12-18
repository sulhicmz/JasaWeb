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

  // Use safe property assignment to prevent object injection
  for (const key of Object.keys(config)) {
    if (
      typeof key === 'string' &&
      allowedEnvKeysSet.has(key) &&
      /^[A-Z_][A-Z0-9_]*$/.test(key) &&
      config[key] !== undefined
    ) {
      // Use Object.defineProperty with specific properties to prevent prototype pollution
      // Ensure key is a valid string and not a prototype property
      const safeKey = key;
      const configValue = config[safeKey];
      if (configValue !== undefined) {
        Object.defineProperty(process.env, safeKey, {
          value: String(configValue),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
