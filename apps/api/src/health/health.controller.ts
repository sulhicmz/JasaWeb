import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
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
  @ApiOperation({
    summary: 'Comprehensive health check',
    description:
      'Checks the health of all critical system components including HTTP connectivity and database',
  })
  @ApiResponse({
    status: 200,
    description: 'All systems healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            http: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - One or more components are down',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            http: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
              },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Database health check',
    description:
      'Checks the connectivity and health of the database connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database is down or unreachable',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
              },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'HTTP connectivity check',
    description: 'Checks external HTTP connectivity to verify internet access',
  })
  @ApiResponse({
    status: 200,
    description: 'HTTP connectivity is working',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            http: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'HTTP connectivity failed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            http: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
              },
            },
          },
        },
      },
    },
  })
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
