import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseValidationService {
  private readonly logger = new Logger(DatabaseValidationService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Validates database connection and security configuration
   */
  async validateDatabaseConnection(): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      return {
        valid: false,
        error: 'DATABASE_URL environment variable is not set',
      };
    }

    // Security checks for database URL
    const securityCheck = this.validateDatabaseUrlSecurity(databaseUrl);
    if (!securityCheck.valid) {
      return securityCheck;
    }

    // Test actual database connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    try {
      await prisma.$connect();
      await prisma.$disconnect();
      return { valid: true };
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      return {
        valid: false,
        error: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validates security aspects of the database URL
   */
  private validateDatabaseUrlSecurity(databaseUrl: string): {
    valid: boolean;
    error?: string;
  } {
    try {
      const url = new URL(databaseUrl);

      // Check for default/weak passwords
      const password = url.password;
      if (
        password &&
        ['password', '123456', 'admin', 'root', 'test'].includes(
          password.toLowerCase()
        )
      ) {
        return {
          valid: false,
          error:
            'Database URL contains a weak or default password. Please use a strong, unique password.',
        };
      }

      // Check for localhost in production
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      if (
        isProduction &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      ) {
        return {
          valid: false,
          error:
            'Production environment should not use localhost database connection',
        };
      }

      // Check for SSL requirement in production
      if (isProduction && !url.searchParams.has('sslmode')) {
        return {
          valid: false,
          error:
            'Production database connections should use SSL (sslmode=require)',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid database URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Gets database connection status for health checks
   */
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    details?: string;
  }> {
    const validation = await this.validateDatabaseConnection();

    if (validation.valid) {
      return { status: 'healthy' };
    } else {
      return {
        status: 'unhealthy',
        details: validation.error,
      };
    }
  }
}
