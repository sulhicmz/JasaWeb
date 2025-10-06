import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async () => ({
        ttl: parseInt(process.env.CACHE_TTL) || 5, // Time to live in seconds
        max: parseInt(process.env.CACHE_MAX) || 100, // Maximum number of items in cache
      }),
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}