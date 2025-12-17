import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
// import { logger } from '../../../../../packages/config/logger';

interface SafeObject {
  [key: string]: unknown;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
  };
}

export interface SecurityMetadata {
  requireAuth?: boolean;
  rateLimitKey?: string;
  auditLog?: boolean;
  sensitiveOperation?: boolean;
}

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const metadata = this.reflector.get<SecurityMetadata>(
      'security',
      context.getHandler()
    );

    // Log request start
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to response headers for tracing
    response.setHeader('X-Request-ID', requestId);

    // Capture security-relevant information
    const securityInfo: SafeObject = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent') || 'unknown',
      ip: this.getClientIP(request),
      origin: request.get('Origin') || 'unknown',
      referer: request.get('Referer') || 'unknown',
      userId: request.user?.id || 'anonymous',
      organizationId:
        request.get('X-Tenant-ID') || request.user?.organizationId || 'none',
      timestamp: new Date().toISOString(),
    };

    // Log request with security context
    if (metadata?.auditLog || metadata?.sensitiveOperation) {
      this.logger.log(
        `Request started: ${request.method} ${request.url} by ${(securityInfo.userId as string) || 'anonymous'}`
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;

          // Log successful response
          if (metadata?.auditLog) {
            this.logger.log(
              `Request completed: ${request.method} ${request.url} by ${(securityInfo.userId as string) || 'anonymous'} (${duration}ms)`
            );
          }

          // Sanitize sensitive data from responses
          if (metadata?.sensitiveOperation) {
            this.sanitizeResponseData(data);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Log security-relevant errors
          this.logSecurityError(error, {
            ...securityInfo,
            duration,
            statusCode: error.status || 500,
            errorType: error.constructor.name,
          });
        },
      })
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getClientIP(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0] ||
      request.get('X-Real-IP') ||
      request.get('X-Client-IP') ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeResponseData(data: unknown): unknown {
    // Remove sensitive information from response logs
    if (data !== null && typeof data === 'object') {
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'otp',
        'ssn',
      ];

      const sanitize = (obj: unknown): unknown => {
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }

        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          const sanitized: SafeObject = {};
          const sensitiveFieldsSet = new Set(sensitiveFields);
          const objKeys = Object.keys(obj) as string[];

          for (const key of objKeys) {
            const value = obj[key as keyof typeof obj];
            const lowerKey = key.toLowerCase();
            const hasSensitiveField = Array.from(sensitiveFieldsSet).some(
              (field: string) => lowerKey.includes(field)
            );

            if (hasSensitiveField) {
              // Security: Use Object.defineProperty with explicit configuration to prevent injection
              Object.defineProperty(sanitized, key, {
                value: '[REDACTED]',
                writable: true,
                enumerable: true,
                configurable: true,
              });
            } else if (typeof value === 'object' && value !== null) {
              // Use Object.defineProperty for nested objects as well
              Object.defineProperty(sanitized, key, {
                value: sanitize(value),
                writable: true,
                enumerable: true,
                configurable: true,
              });
            } else {
              // Use Object.defineProperty for regular values
              Object.defineProperty(sanitized, key, {
                value: value,
                writable: true,
                enumerable: true,
                configurable: true,
              });
            }
          }
          return sanitized;
        }

        return obj;
      };

      return sanitize(data);
    }
    return data;
  }

  private isValidObject(obj: unknown): obj is Record<string, unknown> {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  private logSecurityError(
    error: Error & { status?: number },
    context: SafeObject
  ): void {
    const securityRelevantErrors = new Set([
      'UnauthorizedError',
      'ForbiddenError',
      'RateLimitExceeded',
      'CSRFError',
      'ValidationError',
    ]);

    const isSecurityError =
      securityRelevantErrors.has(error.constructor.name) ||
      error.status === 401 ||
      error.status === 403 ||
      error.status === 429;

    if (isSecurityError) {
      this.logger.warn(`Security error: ${error.message}`, {
        ip: context.ipAddress,
        userAgent: context.userAgent,
      });
    } else {
      this.logger.error(`Request error: ${error.message}`, {
        stack: error.stack,
      });
    }
  }
}
