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

  // Security: Use approved Set approach to prevent object injection
  const safeEntries = Object.entries(config).filter(
    ([key, value]) =>
      value !== undefined &&
      typeof key === 'string' &&
      /^[A-Z_][A-Z0-9_]*$/.test(key) &&
      allowedEnvKeysSet.has(key)
  );

  // Security: Avoid dynamic property assignment completely
  // Process environment updates directly without intermediate object

  // Explicitly assign to process.env for each allowed key
  const allowedAssignments: Partial<Record<string, string>> = {};
  safeEntries.forEach(([key, value]) => {
    if (key === 'NODE_ENV') allowedAssignments.NODE_ENV = String(value);
    else if (key === 'PORT') allowedAssignments.PORT = String(value);
    else if (key === 'DATABASE_URL')
      allowedAssignments.DATABASE_URL = String(value);
    else if (key === 'JWT_SECRET')
      allowedAssignments.JWT_SECRET = String(value);
    else if (key === 'JWT_REFRESH_SECRET')
      allowedAssignments.JWT_REFRESH_SECRET = String(value);
    else if (key === 'SESSION_SECRET')
      allowedAssignments.SESSION_SECRET = String(value);
    else if (key === 'ENCRYPTION_KEY')
      allowedAssignments.ENCRYPTION_KEY = String(value);
    else if (key === 'CORS_ORIGIN')
      allowedAssignments.CORS_ORIGIN = String(value);
    else if (key === 'API_BASE_URL')
      allowedAssignments.API_BASE_URL = String(value);
    else if (key === 'WEB_BASE_URL')
      allowedAssignments.WEB_BASE_URL = String(value);
    else if (key === 'FRONTEND_URL')
      allowedAssignments.FRONTEND_URL = String(value);
    else if (key === 'SMTP_HOST') allowedAssignments.SMTP_HOST = String(value);
    else if (key === 'SMTP_PORT') allowedAssignments.SMTP_PORT = String(value);
    else if (key === 'SMTP_USER') allowedAssignments.SMTP_USER = String(value);
    else if (key === 'SMTP_PASS') allowedAssignments.SMTP_PASS = String(value);
    else if (key === 'SMTP_SECURE')
      allowedAssignments.SMTP_SECURE = String(value);
    else if (key === 'POSTGRES_HOST')
      allowedAssignments.POSTGRES_HOST = String(value);
    else if (key === 'POSTGRES_PORT')
      allowedAssignments.POSTGRES_PORT = String(value);
  });

  // Apply the environment variable updates safely with explicit assignments
  if (allowedAssignments.NODE_ENV)
    process.env.NODE_ENV = allowedAssignments.NODE_ENV;
  if (allowedAssignments.PORT) process.env.PORT = allowedAssignments.PORT;
  if (allowedAssignments.DATABASE_URL)
    process.env.DATABASE_URL = allowedAssignments.DATABASE_URL;
  if (allowedAssignments.JWT_SECRET)
    process.env.JWT_SECRET = allowedAssignments.JWT_SECRET;
  if (allowedAssignments.JWT_REFRESH_SECRET)
    process.env.JWT_REFRESH_SECRET = allowedAssignments.JWT_REFRESH_SECRET;
  if (allowedAssignments.SESSION_SECRET)
    process.env.SESSION_SECRET = allowedAssignments.SESSION_SECRET;
  if (allowedAssignments.ENCRYPTION_KEY)
    process.env.ENCRYPTION_KEY = allowedAssignments.ENCRYPTION_KEY;
  if (allowedAssignments.CORS_ORIGIN)
    process.env.CORS_ORIGIN = allowedAssignments.CORS_ORIGIN;
  if (allowedAssignments.API_BASE_URL)
    process.env.API_BASE_URL = allowedAssignments.API_BASE_URL;
  if (allowedAssignments.WEB_BASE_URL)
    process.env.WEB_BASE_URL = allowedAssignments.WEB_BASE_URL;
  if (allowedAssignments.FRONTEND_URL)
    process.env.FRONTEND_URL = allowedAssignments.FRONTEND_URL;
  if (allowedAssignments.SMTP_HOST)
    process.env.SMTP_HOST = allowedAssignments.SMTP_HOST;
  if (allowedAssignments.SMTP_PORT)
    process.env.SMTP_PORT = allowedAssignments.SMTP_PORT;
  if (allowedAssignments.SMTP_USER)
    process.env.SMTP_USER = allowedAssignments.SMTP_USER;
  if (allowedAssignments.SMTP_PASS)
    process.env.SMTP_PASS = allowedAssignments.SMTP_PASS;
  if (allowedAssignments.SMTP_SECURE)
    process.env.SMTP_SECURE = allowedAssignments.SMTP_SECURE;
  if (allowedAssignments.POSTGRES_HOST)
    process.env.POSTGRES_HOST = allowedAssignments.POSTGRES_HOST;
  if (allowedAssignments.POSTGRES_PORT)
    process.env.POSTGRES_PORT = allowedAssignments.POSTGRES_PORT;

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
