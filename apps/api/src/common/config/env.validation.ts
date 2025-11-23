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
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

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

  return validatedConfig;
}
