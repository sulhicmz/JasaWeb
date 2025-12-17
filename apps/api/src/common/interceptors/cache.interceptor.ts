import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_ENABLED_METADATA = 'cache_enabled';

/**
 * Custom metadata for caching
 */
export const CacheKey =
  (key: string) =>
  (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
  };

export const CacheTTL =
  (ttl: number) =>
  (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
  };

export const CacheEnabled =
  (enabled: boolean = true) =>
  (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_ENABLED_METADATA, enabled, descriptor.value);
  };

/**
 * Caching Interceptor
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();

    // Get caching metadata
    const cacheKey =
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler()) ||
      this.reflector.get<string>(CACHE_KEY_METADATA, context.getClass());
    const cacheTTL =
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ||
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getClass());
    const cacheEnabled =
      this.reflector.get<boolean>(
        CACHE_ENABLED_METADATA,
        context.getHandler()
      ) ||
      this.reflector.get<boolean>(CACHE_ENABLED_METADATA, context.getClass()) ||
      true;

    // Skip caching if explicitly disabled or no key provided
    if (!cacheEnabled || !cacheKey) {
      return next.handle();
    }

    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    try {
      // Generate cache key with organization context
      const organizationId =
        request.organizationId || request.user?.organizationId;
      const userId = request.user?.id;

      let fullCacheKey = cacheKey;

      if (organizationId) {
        fullCacheKey += `:org:${organizationId}`;
      }

      if (userId) {
        fullCacheKey += `:user:${userId}`;
      }

      // Add query parameters to key
      const queryParams = new URLSearchParams(request.query).toString();
      if (queryParams) {
        fullCacheKey += `:params:${queryParams}`;
      }

      // Try to get from cache
      const cached = await this.cacheService.get(fullCacheKey);
      if (cached !== undefined) {
        this.logger.debug(`Cache HIT: ${fullCacheKey}`);
        return of(cached);
      }

      this.logger.debug(`Cache MISS: ${fullCacheKey}`);

      // Execute and cache the result
      return next.handle().pipe(
        tap(async (response) => {
          await this.cacheService.set(fullCacheKey, response, cacheTTL);
          this.logger.debug(`Cache SET: ${fullCacheKey}, TTL: ${cacheTTL}s`);
        })
      );
    } catch (error) {
      this.logger.error('Cache interceptor error:', error);
      // Fallback to execute without caching
      return next.handle();
    }
  }
}
