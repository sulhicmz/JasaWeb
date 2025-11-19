import { SetMetadata } from '@nestjs/common';
import { CACHE_KEY_METADATA } from '@nestjs/cache-manager';

export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_KEY_PREFIX_METADATA = 'cache_key_prefix';

/**
 * Decorator to enable caching for a method with custom TTL
 * @param ttl Time to live in seconds (default: 300 = 5 minutes)
 */
export const Cache = (ttl: number = 300) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    SetMetadata(CACHE_KEY_METADATA, true)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator to set custom cache key prefix
 * @param prefix Custom prefix for cache keys
 */
export const CacheKey = (prefix: string) => {
  return SetMetadata(CACHE_KEY_PREFIX_METADATA, prefix);
};

/**
 * Decorator to bypass cache for a method
 */
export const CacheBypass = () => {
  return SetMetadata('cache_bypass', true);
};
