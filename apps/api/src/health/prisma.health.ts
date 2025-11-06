import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to connect to the database
      await this.prismaService.$queryRaw`SELECT 1`;
      
      // If we reach here, the database is healthy
      return this.getStatus(key, true);
    } catch (error: unknown) {
      // If there's an error, the database is not healthy
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError('Prisma check failed', this.getStatus(key, false, { error: errorMessage }));
    }
  }
}