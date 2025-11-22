import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  async onModuleInit() {
    this.validateRequiredEnvironmentVariables();
  }

  private validateRequiredEnvironmentVariables() {
    const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          `Please set these variables in your environment or .env file.\n` +
          `Refer to .env.example for guidance on generating secure secrets.`
      );
    }

    // Validate JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security.\n' +
          'Generate a strong secret using: openssl rand -base64 32'
      );
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be at least 32 characters long for security.\n' +
          'Generate a strong secret using: openssl rand -base64 32'
      );
    }
  }
}
