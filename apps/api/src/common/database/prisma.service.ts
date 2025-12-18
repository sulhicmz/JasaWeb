import {
  INestApplication,
  Injectable,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EnvironmentService } from '../config/environment.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private envService: EnvironmentService) {
    super({
      accelerateUrl: envService.databaseUrl,
      log: ['query', 'error', 'info', 'warn'],
      errorFormat: 'pretty',
    });

    // Set up logging for performance monitoring
    (this.$on as any)('query', (e: any) => {
      if (e.duration > 1000) {
        this.logger.warn(
          `Slow query detected: ${e.query} - Duration: ${e.duration}ms`
        );
      }
    });

    (this.$on as any)('error', (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`, e.stack);
    });

    (this.$on as any)('info', (e: any) => {
      this.logger.log(`Prisma info: ${e.message}`);
    });

    (this.$on as any)('warn', (e: any) => {
      this.logger.warn(`Prisma warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    (this.$on as any)('beforeExit', async () => {
      this.logger.log(
        'Disconnecting from database due to application shutdown'
      );
      await this.$disconnect();
    });

    process.on('beforeExit', async () => {
      await app.close();
    });

    process.on('SIGINT', async () => {
      await this.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.$disconnect();
      process.exit(0);
    });
  }
}
