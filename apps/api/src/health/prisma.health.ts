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
    } catch (error) {
      // If there's an error, the database is not healthy
      throw new HealthCheckError('Prisma check failed', this.getStatus(key, false, { error: error.message }));
    }
  }
}