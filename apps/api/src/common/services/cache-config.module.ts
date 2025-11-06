import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async () => ({
        ttl: parseNumber(process.env.CACHE_TTL, 5), // Time to live in seconds
        max: parseNumber(process.env.CACHE_MAX, 100), // Maximum number of items in cache
      }),
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}