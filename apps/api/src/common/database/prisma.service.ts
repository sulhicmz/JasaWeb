import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // PrismaClient doesn't have proper TypeScript support for $on events
    // This method can be implemented differently if needed
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}