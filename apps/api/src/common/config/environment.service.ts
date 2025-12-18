import { Injectable } from '@nestjs/common';
import {
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  generateSecureSecret,
} from './env.validation';
import { DEFAULT_PORTS, DEFAULT_CORS_ORIGINS } from './constants';

@Injectable()
export class EnvironmentService {
  get nodeEnv(): string {
    return getOptionalEnv('NODE_ENV', 'development')!;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return getEnvNumber('PORT', DEFAULT_PORTS.API);
  }

  // Database Configuration
  get databaseUrl(): string {
    return getRequiredEnv('DATABASE_URL');
  }

  get postgresHost(): string | undefined {
    return getOptionalEnv('POSTGRES_HOST');
  }

  get postgresPort(): number {
    return getEnvNumber('POSTGRES_PORT', DEFAULT_PORTS.DATABASE);
  }

  get postgresUser(): string | undefined {
    return getOptionalEnv('POSTGRES_USER');
  }

  get postgresPassword(): string | undefined {
    return getOptionalEnv('POSTGRES_PASSWORD');
  }

  get postgresDb(): string | undefined {
    return getOptionalEnv('POSTGRES_DB');
  }

  // JWT Configuration
  get jwtSecret(): string {
    return getRequiredEnv('JWT_SECRET');
  }

  get jwtRefreshSecret(): string {
    return getRequiredEnv('JWT_REFRESH_SECRET');
  }

  get jwtExpiresIn(): string {
    return getOptionalEnv('JWT_EXPIRES_IN', '1h')!;
  }

  get jwtRefreshExpiresIn(): string {
    return getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d')!;
  }

  // Session Configuration
  get sessionSecret(): string {
    return getRequiredEnv('SESSION_SECRET');
  }

  get sessionMaxAgeHours(): number {
    return getEnvNumber('SESSION_MAX_AGE_HOURS', 24);
  }

  // Encryption Configuration
  get encryptionKey(): string {
    return getRequiredEnv('ENCRYPTION_KEY');
  }

  // CORS Configuration
  get corsOrigins(): string[] {
    const corsOrigin = getOptionalEnv('CORS_ORIGIN');
    if (corsOrigin) {
      return corsOrigin.split(',').map((origin) => origin.trim());
    }
    return [...DEFAULT_CORS_ORIGINS];
  }

  // Application URLs
  get frontendUrl(): string {
    return getOptionalEnv(
      'FRONTEND_URL',
      `http://localhost:${DEFAULT_PORTS.WEB}`
    )!;
  }

  get apiUrl(): string {
    return getOptionalEnv(
      'API_BASE_URL',
      `http://localhost:${DEFAULT_PORTS.API}`
    )!;
  }

  // Email Configuration
  get smtpHost(): string | undefined {
    return getOptionalEnv('SMTP_HOST');
  }

  get smtpPort(): number {
    return getEnvNumber('SMTP_PORT', 587);
  }

  get smtpUser(): string | undefined {
    return getOptionalEnv('SMTP_USER');
  }

  get smtpPass(): string | undefined {
    return getOptionalEnv('SMTP_PASS');
  }

  get smtpSecure(): boolean {
    return getEnvBoolean('SMTP_SECURE', false);
  }

  // Redis Configuration
  get redisUrl(): string | undefined {
    return getOptionalEnv('REDIS_URL');
  }

  get redisHost(): string {
    return getOptionalEnv('REDIS_HOST', 'localhost')!;
  }

  get redisPort(): number {
    return getEnvNumber('REDIS_PORT', DEFAULT_PORTS.REDIS);
  }

  // S3 Configuration
  get s3Endpoint(): string | undefined {
    return getOptionalEnv('S3_ENDPOINT');
  }

  get s3Region(): string {
    return getOptionalEnv('S3_REGION', 'us-east-1')!;
  }

  get s3AccessKeyId(): string | undefined {
    return getOptionalEnv('S3_ACCESS_KEY_ID');
  }

  get s3SecretAccessKey(): string | undefined {
    return getOptionalEnv('S3_SECRET_ACCESS_KEY');
  }

  get s3Bucket(): string | undefined {
    return getOptionalEnv('S3_BUCKET');
  }

  get isS3Compatible(): boolean {
    return !!this.s3Endpoint;
  }

  // File Upload Configuration
  get uploadDir(): string {
    return getOptionalEnv('UPLOAD_DIR', '/tmp/uploads')!;
  }

  // Rate Limiting Configuration
  get throttleTtl(): number {
    return getEnvNumber('RATE_LIMIT_TTL', 60);
  }

  get throttleLimit(): number {
    return getEnvNumber('RATE_LIMIT_MAX', 10);
  }

  get authRateLimitTtl(): number {
    return getEnvNumber('AUTH_RATE_LIMIT_TTL', 900);
  }

  get authRateLimitMax(): number {
    return getEnvNumber('AUTH_RATE_LIMIT_MAX', 5);
  }

  // Security Configuration
  get passwordMinLength(): number {
    return getEnvNumber('PASSWORD_MIN_LENGTH', 8);
  }

  get passwordRequireUppercase(): boolean {
    return getEnvBoolean('PASSWORD_REQUIRE_UPPERCASE', true);
  }

  get passwordRequireLowercase(): boolean {
    return getEnvBoolean('PASSWORD_REQUIRE_LOWERCASE', true);
  }

  get passwordRequireNumbers(): boolean {
    return getEnvBoolean('PASSWORD_REQUIRE_NUMBERS', true);
  }

  get passwordRequireSpecial(): boolean {
    return getEnvBoolean('PASSWORD_REQUIRE_SPECIAL', true);
  }

  get accountLockoutEnabled(): boolean {
    return getEnvBoolean('ACCOUNT_LOCKOUT_ENABLED', true);
  }

  get lockoutMaxAttempts(): number {
    return getEnvNumber('LOCKOUT_MAX_ATTEMPTS', 5);
  }

  get lockoutDurationMinutes(): number {
    return getEnvNumber('LOCKOUT_DURATION_MINUTES', 30);
  }

  // Utility Methods
  generateSecureSecret(length: number = 32): string {
    return generateSecureSecret(length);
  }

  isSecureEnvironment(): boolean {
    if (this.isDevelopment) return true;

    const defaultSecrets = [
      'your-super-secret-jwt-key-change-in-production',
      'your-super-secret-jwt-key',
      'your-super-secret-session-key-change-in-production',
      'your-super-secret-session-key',
      'change-me-in-production',
      'default-secret-key',
    ];

    // Check for weak secrets
    if (defaultSecrets.includes(this.jwtSecret)) return false;
    if (defaultSecrets.includes(this.jwtRefreshSecret)) return false;
    if (defaultSecrets.includes(this.sessionSecret)) return false;
    if (defaultSecrets.includes(this.encryptionKey)) return false;

    return true;
  }
}
