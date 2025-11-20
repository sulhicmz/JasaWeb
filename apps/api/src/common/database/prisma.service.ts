import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // Properly typed event handler for Prisma beforeExit event
    this.$on('beforeExit', async () => {
      this.logger.log('Prisma beforeExit event triggered, closing application');
      await app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
