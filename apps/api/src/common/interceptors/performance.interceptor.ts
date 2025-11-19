import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { CACHE_KEY_METADATA } from '@nestjs/cache-manager';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(
    private readonly performanceService: PerformanceMonitoringService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    // Check if this endpoint has caching enabled
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler()
    );

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Determine if this was a cache hit
          const cacheHit =
            response.headers && response.headers['x-cache-status'] === 'HIT';

          // Record performance metrics
          await this.performanceService.recordRequestMetric(
            url,
            method,
            responseTime,
            cacheHit
          );

          // Add performance headers
          response.setHeader('X-Response-Time', `${responseTime}ms`);
          response.setHeader('X-Cache-Hit', cacheHit ? 'true' : 'false');

          // Log performance for slow requests
          if (responseTime > 1000) {
            this.logger.warn(
              `Slow request: ${method} ${url} - ${responseTime}ms`
            );
          }
        },
        error: async (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Record performance metrics for failed requests too
          await this.performanceService.recordRequestMetric(
            url,
            method,
            responseTime,
            false
          );

          this.logger.error(
            `Request failed: ${method} ${url} - ${responseTime}ms - ${error.message}`
          );
        },
      })
    );
  }
}
