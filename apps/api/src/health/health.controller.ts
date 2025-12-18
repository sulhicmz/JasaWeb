import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealthIndicator: PrismaHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  async check() {
    try {
      return await this.health.check([
        // Check HTTP connectivity
        () => this.http.pingCheck('http', 'https://httpbin.org/get'),

        // Check database connectivity
        () => this.prismaHealthIndicator.isHealthy('database'),
      ]);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Health check failed: ${message}`);
      throw error;
    }
  }

  @Get('database')
  @HealthCheck()
  @Public()
  async databaseCheck() {
    try {
      return await this.health.check([
        () => this.prismaHealthIndicator.isHealthy('database'),
      ]);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Database health check failed: ${message}`);
      throw error;
    }
  }

  @Get('http')
  @HealthCheck()
  @Public()
  async httpCheck() {
    try {
      return await this.health.check([
        () => this.http.pingCheck('http', 'https://httpbin.org/get'),
      ]);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`HTTP health check failed: ${message}`);
      throw error;
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
