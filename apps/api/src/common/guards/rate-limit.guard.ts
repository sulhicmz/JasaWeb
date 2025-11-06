import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Rate Limit Guard
 * Provides additional rate limiting for sensitive endpoints
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, number[]>();
  private readonly defaultLimit = 5;
  private readonly defaultWindow = 60000; // 1 minute

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || this.defaultLimit;
    const window = this.reflector.get<number>('rateLimitWindow', context.getHandler()) || this.defaultWindow;

    const key = this.getKey(request);
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < window);

    if (validTimestamps.length >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          error: 'Rate Limit Exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Generate a unique key for rate limiting
   */
  private getKey(request: Request): string {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userId = (request as any).user?.id || 'anonymous';
    return `${ip}:${userId}:${request.path}`;
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.defaultWindow * 2);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Decorator to set rate limit for a specific endpoint
 */
export const RateLimit = (limit: number, window?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', limit, descriptor.value);
    if (window) {
      Reflect.defineMetadata('rateLimitWindow', window, descriptor.value);
    }
    return descriptor;
  };
};
