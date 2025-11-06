import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

<<<<<<< HEAD
=======
const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

>>>>>>> origin/main
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async () => ({
<<<<<<< HEAD
        ttl: parseInt(process.env.CACHE_TTL) || 5, // Time to live in seconds
        max: parseInt(process.env.CACHE_MAX) || 100, // Maximum number of items in cache
=======
        ttl: parseNumber(process.env.CACHE_TTL, 5), // Time to live in seconds
        max: parseNumber(process.env.CACHE_MAX, 100), // Maximum number of items in cache
>>>>>>> origin/main
      }),
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}