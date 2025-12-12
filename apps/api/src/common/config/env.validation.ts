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
  MinLength,
  Matches,
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
  @IsUrl({ protocols: ['postgresql'], require_protocol: true })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

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
  @Matches(/^[a-fA-F0-9]{32}$/, {
    message: 'ENCRYPTION_KEY must be a 32-character hexadecimal string',
  })
  ENCRYPTION_KEY?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-fA-F0-9]{32}$/, {
    message: 'SESSION_SECRET must be a 32-character hexadecimal string',
  })
  SESSION_SECRET?: string;

  @IsString()
  @IsOptional()
  @MinLength(32)
  @Matches(/^(?!.*CHANGE_THIS).*$/, {
    message: 'SMTP_FROM must not contain placeholder values',
  })
  SMTP_FROM?: string;
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

  // Enhanced security validations
  const jwtSecret = config.JWT_SECRET as string;
  if (jwtSecret && jwtSecret.includes('CHANGE_THIS')) {
    throw new Error(
      'JWT_SECRET appears to be using the default/example value. Please generate a secure random string.'
    );
  }

  const jwtRefreshSecret = config.JWT_REFRESH_SECRET as string;
  if (jwtRefreshSecret && jwtRefreshSecret.includes('CHANGE_THIS')) {
    throw new Error(
      'JWT_REFRESH_SECRET appears to be using the default/example value. Please generate a secure random string.'
    );
  }

  // Validate database URL doesn't contain obvious insecure values
  const databaseUrl = config.DATABASE_URL as string;
  if (databaseUrl && databaseUrl.includes('user:password')) {
    throw new Error(
      'DATABASE_URL appears to contain default credentials. Please configure proper database credentials.'
    );
  }

  // Production-specific security checks
  if (config.NODE_ENV === 'production') {
    if (databaseUrl && databaseUrl.includes('localhost')) {
      throw new Error(
        'DATABASE_URL should not use localhost in production environment'
      );
    }

    if (!config.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is required in production environment');
    }
  }

  return validatedConfig;
}
