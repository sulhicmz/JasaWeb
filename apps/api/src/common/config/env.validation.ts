import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  validateSync,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  // Application Configuration
  @IsString()
  @IsOptional()
  APP_NAME: string = 'JasaWeb API';

  @IsString()
  @IsOptional()
  APP_VERSION: string = '1.0.0';

  @IsString()
  @IsOptional()
  API_BASE_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:4321';

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api';

  @IsString()
  @IsOptional()
  API_VERSION: string = 'v1';

  @IsNumber()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  API_TIMEOUT: number = 30000;

  // Database Configuration
  @IsString()
  DATABASE_URL!: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  DATABASE_POOL_SIZE: number = 10;

  @IsNumber()
  @Min(5000)
  @Max(300000)
  @IsOptional()
  DATABASE_CONNECTION_TIMEOUT: number = 30000;

  @IsNumber()
  @Min(5000)
  @Max(300000)
  @IsOptional()
  DATABASE_QUERY_TIMEOUT: number = 30000;

  // Security Configuration
  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  SESSION_SECRET!: string;

  @IsNumber()
  @Min(8)
  @Max(64)
  @IsOptional()
  BCRYPT_ROUNDS: number = 12;

  @IsString()
  @IsOptional()
  ENCRYPTION_KEY!: string;

  @IsString()
  @IsOptional()
  ENCRYPTION_ALGORITHM: string = 'aes-256-gcm';

  // Password Policy
  @IsNumber()
  @Min(6)
  @Max(128)
  @IsOptional()
  PASSWORD_MIN_LENGTH: number = 8;

  @IsOptional()
  PASSWORD_REQUIRE_UPPERCASE: boolean = true;

  @IsOptional()
  PASSWORD_REQUIRE_LOWERCASE: boolean = true;

  @IsOptional()
  PASSWORD_REQUIRE_NUMBERS: boolean = true;

  @IsOptional()
  PASSWORD_REQUIRE_SPECIAL: boolean = true;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  PASSWORD_MAX_AGE_DAYS: number = 90;

  @IsNumber()
  @Min(1)
  @Max(24)
  @IsOptional()
  PASSWORD_PREVENT_REUSE: number = 5;

  // Account Lockout
  @IsOptional()
  ACCOUNT_LOCKOUT_ENABLED: boolean = true;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  LOCKOUT_MAX_ATTEMPTS: number = 5;

  @IsNumber()
  @Min(1)
  @Max(1440)
  @IsOptional()
  LOCKOUT_DURATION_MINUTES: number = 30;

  @IsNumber()
  @Min(1)
  @Max(1440)
  @IsOptional()
  LOCKOUT_RESET_AFTER_MINUTES: number = 60;

  // Session Configuration
  @IsNumber()
  @Min(1)
  @Max(168)
  @IsOptional()
  SESSION_MAX_AGE_HOURS: number = 24;

  @IsNumber()
  @Min(1)
  @Max(720)
  @IsOptional()
  SESSION_ABSOLUTE_TIMEOUT_HOURS: number = 72;

  @IsNumber()
  @Min(5)
  @Max(480)
  @IsOptional()
  SESSION_INACTIVITY_TIMEOUT_MINUTES: number = 30;

  // CORS Configuration
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:4321';

  // Rate Limiting
  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @Min(1)
  @Max(10000)
  @IsOptional()
  RATE_LIMIT_MAX: number = 100;

  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  AUTH_RATE_LIMIT_TTL: number = 900;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  AUTH_RATE_LIMIT_MAX: number = 5;

  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  API_RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  API_RATE_LIMIT_MAX: number = 100;

  // Cache Configuration
  @IsNumber()
  @Min(1)
  @Max(7200)
  @IsOptional()
  CACHE_TTL: number = 300;

  @IsNumber()
  @Min(1)
  @Max(100000)
  @IsOptional()
  CACHE_MAX: number = 1000;

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB: number = 0;

  @IsString()
  @IsOptional()
  REDIS_KEY_PREFIX: string = 'jasaweb:';

  @IsNumber()
  @Min(10)
  @Max(10000)
  @IsOptional()
  REDIS_RETRY_DELAY: number = 100;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  REDIS_MAX_RETRIES: number = 3;

  // Throttling Configuration
  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  THROTTLE_LIMIT: number = 100;

  // File Upload Configuration
  @IsNumber()
  @Min(1024)
  @Max(104857600) // 100MB
  @IsOptional()
  UPLOAD_MAX_SIZE: number = 10485760; // 10MB

  @IsString()
  @IsOptional()
  UPLOAD_ALLOWED_TYPES: string =
    'image/jpeg,image/png,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  @IsString()
  @IsOptional()
  UPLOAD_DESTINATION: string = './uploads';

  // Email Configuration
  @IsString()
  @IsOptional()
  EMAIL_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  EMAIL_PORT: number = 587;

  @IsOptional()
  EMAIL_SECURE: boolean = false;

  @IsString()
  @IsOptional()
  EMAIL_USER?: string;

  @IsString()
  @IsOptional()
  EMAIL_PASSWORD?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM: string = 'noreply@jasaweb.com';

  @IsString()
  @IsOptional()
  EMAIL_TEMPLATES_PATH: string = './templates';

  // Logging Configuration
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  LOG_FORMAT: string = 'json';

  @IsString()
  @IsOptional()
  LOG_FILE?: string;

  @IsString()
  @IsOptional()
  LOG_MAX_SIZE: string = '20m';

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  LOG_MAX_FILES: number = 14;

  // Monitoring Configuration
  @IsOptional()
  MONITORING_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  METRICS_PATH: string = '/metrics';

  @IsString()
  @IsOptional()
  HEALTH_CHECK_PATH: string = '/health';

  // Feature Flags
  @IsOptional()
  FEATURE_REGISTRATION: boolean = true;

  @IsOptional()
  FEATURE_EMAIL_VERIFICATION: boolean = true;

  @IsOptional()
  FEATURE_PASSWORD_RESET: boolean = true;

  @IsOptional()
  FEATURE_MULTI_TENANCY: boolean = true;

  @IsOptional()
  FEATURE_ANALYTICS: boolean = true;

  @IsOptional()
  FEATURE_KNOWLEDGE_BASE: boolean = true;

  @IsOptional()
  FEATURE_FILE_MANAGEMENT: boolean = true;

  @IsOptional()
  FEATURE_APPROVALS: boolean = true;

  @IsOptional()
  FEATURE_INVOICES: boolean = true;

  // Business Configuration
  @IsString()
  @IsOptional()
  COMPANY_NAME: string = 'JasaWeb';

  @IsString()
  @IsOptional()
  COMPANY_EMAIL: string = 'contact@jasaweb.com';

  @IsString()
  @IsOptional()
  COMPANY_PHONE: string = '+62-21-1234-5678';

  @IsString()
  @IsOptional()
  COMPANY_ADDRESS: string = 'Jakarta, Indonesia';

  @IsString()
  @IsOptional()
  COMPANY_WEBSITE: string = 'https://jasaweb.com';

  @IsNumber()
  @Min(1000000)
  @Max(100000000)
  @IsOptional()
  SCHOOL_WEBSITE_BASE_PRICE: number = 15000000;

  @IsNumber()
  @Min(1)
  @Max(52)
  @IsOptional()
  SCHOOL_WEBSITE_DELIVERY_WEEKS: number = 8;

  @IsNumber()
  @Min(1000000)
  @Max(100000000)
  @IsOptional()
  NEWS_PORTAL_BASE_PRICE: number = 20000000;

  @IsNumber()
  @Min(1)
  @Max(52)
  @IsOptional()
  NEWS_PORTAL_DELIVERY_WEEKS: number = 10;

  @IsNumber()
  @Min(1000000)
  @Max(100000000)
  @IsOptional()
  COMPANY_PROFILE_BASE_PRICE: number = 10000000;

  @IsNumber()
  @Min(1)
  @Max(52)
  @IsOptional()
  COMPANY_PROFILE_DELIVERY_WEEKS: number = 6;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  // Custom validation for JWT secret lengths
  const jwtSecret = config.JWT_SECRET as string;
  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters long for security. Current length: ${jwtSecret.length}`
    );
  }

  const jwtRefreshSecret = config.JWT_REFRESH_SECRET as string;
  if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
    throw new Error(
      `JWT_REFRESH_SECRET must be at least 32 characters long for security. Current length: ${jwtRefreshSecret.length}`
    );
  }

  // Validate session secret if provided
  const sessionSecret = config.SESSION_SECRET as string;
  if (sessionSecret && sessionSecret.length < 32) {
    throw new Error(
      `SESSION_SECRET must be at least 32 characters long for security. Current length: ${sessionSecret.length}`
    );
  }

  // Validate encryption key if provided
  const encryptionKey = config.ENCRYPTION_KEY as string;
  if (encryptionKey && encryptionKey.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 characters long for AES-256-GCM. Current length: ${encryptionKey.length}`
    );
  }

  // Validate database URL format
  const databaseUrl = config.DATABASE_URL as string;
  if (
    databaseUrl &&
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    throw new Error(
      `DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://`
    );
  }

  // Validate bcrypt rounds
  const bcryptRounds = parseInt(config.BCRYPT_ROUNDS as string) || 12;
  if (bcryptRounds < 10 || bcryptRounds > 15) {
    throw new Error(
      `BCRYPT_ROUNDS must be between 10 and 15 for security. Current value: ${bcryptRounds}`
    );
  }

  // Validate API timeout
  const apiTimeout = parseInt(config.API_TIMEOUT as string) || 30000;
  if (apiTimeout < 1000 || apiTimeout > 300000) {
    throw new Error(
      `API_TIMEOUT must be between 1000ms and 300000ms (5 minutes). Current value: ${apiTimeout}`
    );
  }

  // Validate cache TTL
  const cacheTtl = parseInt(config.CACHE_TTL as string) || 300;
  if (cacheTtl < 1 || cacheTtl > 7200) {
    throw new Error(
      `CACHE_TTL must be between 1 and 7200 seconds (2 hours). Current value: ${cacheTtl}`
    );
  }

  // Validate upload max size
  const uploadMaxSize = parseInt(config.UPLOAD_MAX_SIZE as string) || 10485760;
  if (uploadMaxSize < 1024 || uploadMaxSize > 104857600) {
    throw new Error(
      `UPLOAD_MAX_SIZE must be between 1KB and 100MB. Current value: ${uploadMaxSize}`
    );
  }

  // Validate CORS origins in production
  if (config.NODE_ENV === 'production') {
    const corsOrigin = config.CORS_ORIGIN as string;
    if (corsOrigin && corsOrigin.includes('localhost')) {
      throw new Error(
        `CORS_ORIGIN should not contain localhost in production environment`
      );
    }
  }

  // Security warnings for development
  if (config.NODE_ENV === 'development') {
    if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      console.warn(
        '⚠️  Using default JWT secret in development. Please change in production!'
      );
    }
    if (
      jwtRefreshSecret === 'your-super-secret-refresh-key-change-in-production'
    ) {
      console.warn(
        '⚠️  Using default JWT refresh secret in development. Please change in production!'
      );
    }
  }

  return validatedConfig;
}
