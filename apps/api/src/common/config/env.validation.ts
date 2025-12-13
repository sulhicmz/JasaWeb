import { validateEnvironmentVariables } from '@jasaweb/config/env-validation';

export function validateEnv(config: Record<string, unknown>) {
  // Set environment variables from config for validation
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = String(value);
    }
  });

  // Run validation using the shared function
  validateEnvironmentVariables();

  return config;
}
