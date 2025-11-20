import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  async onModuleInit() {
    this.validateRequiredEnvironmentVariables();
  }

  private validateRequiredEnvironmentVariables() {
    const requiredVars = [
      { name: 'JWT_SECRET', minLength: 32 },
      { name: 'DATABASE_URL', minLength: 1 },
    ];

    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    for (const varConfig of requiredVars) {
      const value = process.env[varConfig.name];

      if (!value) {
        missingVars.push(varConfig.name);
        continue;
      }

      if (value.length < varConfig.minLength) {
        invalidVars.push(
          `${varConfig.name} (minimum ${varConfig.minLength} characters required)`
        );
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
          'Please set these variables before starting the application.'
      );
    }

    if (invalidVars.length > 0) {
      throw new Error(
        `Invalid environment variables: ${invalidVars.join(', ')}. ` +
          'Please update these variables with valid values.'
      );
    }
  }
}
