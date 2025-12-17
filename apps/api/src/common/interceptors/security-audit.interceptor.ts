import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface SecurityContext {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userId: string;
  tenantId: string;
  action: string;
}

/**
 * Security Audit Interceptor
 * Optimized logging for security-relevant events
 */
@Injectable()
export class SecurityAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityAuditInterceptor.name);

  // Skip logging for health checks and other frequent non-critical endpoints
  private readonly skipPaths = ['/health', '/metrics', '/favicon.ico'];

  // Cache action names to improve performance
  private readonly actionCache = new Map<string, string>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;

    // Skip logging for non-critical endpoints
    if (this.skipPaths.some((path) => url.includes(path))) {
      return next.handle();
    }

    const user = (request as Request & { user?: { id: string } }).user;
    const tenantId = request.headers['x-tenant-id'] as string;

    const securityContext: SecurityContext = {
      timestamp: new Date().toISOString(),
      method,
      url: this.sanitizeUrl(url),
      ip: this.anonymizeIP(ip || ''),
      userId: user?.id || 'anonymous',
      tenantId: this.sanitizeTenantId(tenantId),
      action: this.getActionFromContext(context),
    };

    // Log the security event with minimal JSON payload
    this.logger.log(`SEC: ${JSON.stringify(securityContext)}`);

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          // Only log slow requests (>100ms) for performance monitoring
          if (duration > 100) {
            this.logger.warn(
              `Slow Security Event: ${method} ${url} - ${duration}ms`
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `Security Event Failed: ${method} ${url} - ${duration}ms - ${error.message}`
          );
          // Don't log full stack trace to reduce verbosity and improve security
        },
      })
    );
  }

  /**
   * Extract action name from execution context with caching
   */
  private getActionFromContext(context: ExecutionContext): string {
    const handler = context.getHandler();
    const controller = context.getClass();
    const handlerName = handler.name;
    const controllerName = controller.name;
    const cacheKey = `${controllerName}.${handlerName}`;

    if (!this.actionCache.has(cacheKey)) {
      this.actionCache.set(cacheKey, cacheKey);
    }

    return this.actionCache.get(cacheKey)!;
  }

  /**
   * Sanitize URL to remove sensitive query parameters
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const sensitiveParams = ['token', 'password', 'secret', 'key', 'auth'];

      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      }

      return urlObj.pathname + urlObj.search;
    } catch {
      // Fallback if URL parsing fails
      return url;
    }
  }

  /**
   * Anonymize IP address for privacy (GDPR compliance)
   */
  private anonymizeIP(ip: string): string {
    if (!ip) return '';

    // For IPv4, mask the last octet
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // For IPv6, mask the last 64 bits
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    }

    return ip;
  }

  /**
   * Sanitize tenant ID for security
   */
  private sanitizeTenantId(tenantId?: string): string {
    if (!tenantId) return 'none';
    // Only show first 4 characters for identification
    return tenantId.length > 4 ? `${tenantId.substring(0, 4)}...` : tenantId;
  }
}
