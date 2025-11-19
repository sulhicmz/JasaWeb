import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { PerformanceMonitoringService } from './performance-monitoring.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379'
        );
        const isRedisAvailable = configService.get<boolean>(
          'REDIS_ENABLED',
          true
        );

        if (isRedisAvailable) {
          try {
            return {
              store: redisStore,
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD'),
              db: configService.get<number>('REDIS_DB', 0),
              ttl: configService.get<number>('CACHE_TTL', 300), // 5 minutes default
              max: configService.get<number>('CACHE_MAX_ITEMS', 1000),
              isGlobal: true,
            };
          } catch (error) {
            console.warn(
              'Redis connection failed, falling back to memory cache:',
              error.message
            );
          }
        }

        // Fallback to memory cache
        return {
          ttl: configService.get<number>('CACHE_TTL', 300),
          max: configService.get<number>('CACHE_MAX_ITEMS', 100),
        };
      },
    }),
  ],
  providers: [PerformanceMonitoringService],
  exports: [CacheModule, PerformanceMonitoringService],
})
export class EnhancedCacheConfigModule {}
