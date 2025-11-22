import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  async onModuleInit() {
    this.validateRequiredEnvironmentVariables();
  }

  private validateRequiredEnvironmentVariables() {
    const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
          'Please check your .env file and ensure all required variables are set.'
      );
    }

    // Validate JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security. ' +
          'Please generate a strong, random secret.'
      );
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (jwtRefreshSecret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be at least 32 characters long for security. ' +
          'Please generate a strong, random secret.'
      );
    }
  }
}
