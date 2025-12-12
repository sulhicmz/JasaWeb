import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute
      },
    ]),
  ],
  controllers: [DashboardController],
  providers: [],
  exports: [],
})
export class DashboardModule {}
