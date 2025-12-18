import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const enableCache = configService.get<boolean>('ENABLE_CACHE', true);
        const cacheTTL = configService.get<number>('CACHE_TTL', 3600);

        if (!enableCache) {
          // Return memory cache for disabled cache mode
          return {
            store: 'memory',
            ttl: cacheTTL * 1000, // Convert to milliseconds
            max: 100, // Maximum number of items in cache
          };
        }

        const redisConfig: any = {
          host: redisHost,
          port: redisPort,
          ttl: cacheTTL, // TTL in seconds
        };

        // Add password if provided
        if (redisPassword) {
          redisConfig.password = redisPassword;
        }

        // Add retry strategy and error handling
        redisConfig.retryDelayOnFailover = 100;
        redisConfig.enableReadyCheck = true;
        redisConfig.maxRetriesPerRequest = 3;

        return {
          store: 'redis',
          ...redisConfig,
        };
      },
    }),
  ],
  providers: [CacheService, CacheInvalidationService],
  exports: [CacheService, CacheInvalidationService, CacheModule],
})
export class RedisCacheModule {}
