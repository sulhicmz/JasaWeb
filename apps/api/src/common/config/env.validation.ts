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

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:4321';

  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  THROTTLE_LIMIT: number = 10;

  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  CACHE_TTL: number = 5;

  @IsNumber()
  @Min(1)
  @Max(10000)
  @IsOptional()
  CACHE_MAX: number = 100;

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string = '';

  // Email Configuration
  @IsString()
  @IsOptional()
  SMTP_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  SMTP_PORT: number = 587;

  @IsString()
  @IsOptional()
  SMTP_USER: string = '';

  @IsString()
  @IsOptional()
  SMTP_PASSWORD: string = '';

  @IsString()
  @IsOptional()
  SMTP_FROM: string = 'noreply@jasaweb.com';

  // AWS S3 Configuration
  @IsString()
  @IsOptional()
  AWS_REGION: string = 'us-east-1';

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID: string = '';

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY: string = '';

  @IsString()
  @IsOptional()
  S3_BUCKET_NAME: string = 'jasaweb-uploads';

  // MinIO Configuration
  @IsString()
  @IsOptional()
  MINIO_ENDPOINT: string = 'http://localhost:9000';

  @IsString()
  @IsOptional()
  MINIO_ACCESS_KEY: string = '';

  @IsString()
  @IsOptional()
  MINIO_SECRET_KEY: string = '';

  @IsString()
  @IsOptional()
  MINIO_BUCKET: string = 'jasaweb-uploads';

  // Session Configuration
  @IsString()
  @IsOptional()
  SESSION_SECRET: string = '';

  @IsNumber()
  @IsOptional()
  SESSION_MAX_AGE: number = 86400000;

  // Security Configuration
  @IsNumber()
  @IsOptional()
  BCRYPT_ROUNDS: number = 10;

  @IsNumber()
  @IsOptional()
  MAX_LOGIN_ATTEMPTS: number = 5;

  @IsNumber()
  @IsOptional()
  LOCKOUT_DURATION: number = 900000;

  @IsString()
  @IsOptional()
  ENCRYPTION_KEY: string = '';

  // Logging Configuration
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  LOG_FILE_PATH: string = './logs';

  // Feature Flags
  @IsString()
  @IsOptional()
  ENABLE_SWAGGER: string = 'true';

  @IsString()
  @IsOptional()
  ENABLE_AUDIT_LOG: string = 'true';

  @IsString()
  @IsOptional()
  ENABLE_EMAIL_NOTIFICATIONS: string = 'true';

  // Health Check Configuration
  @IsString()
  @IsOptional()
  HEALTH_CHECK_URL: string = 'https://httpbin.org/get';
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

  // Custom validation for session secret length
  const sessionSecret = config.SESSION_SECRET as string;
  if (sessionSecret && sessionSecret.length < 32) {
    throw new Error(
      `SESSION_SECRET must be at least 32 characters long for security. Current length: ${sessionSecret.length}`
    );
  }

  // Custom validation for encryption key length
  const encryptionKey = config.ENCRYPTION_KEY as string;
  if (encryptionKey && encryptionKey.length < 32) {
    throw new Error(
      `ENCRYPTION_KEY must be at least 32 characters long for security. Current length: ${encryptionKey.length}`
    );
  }

  return validatedConfig;
}
