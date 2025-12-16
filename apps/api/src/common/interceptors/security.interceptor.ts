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
import { logger } from '../../../../../packages/config/logger';

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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
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
    const securityInfo = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: this.getClientIP(request),
      origin: request.get('Origin'),
      referer: request.get('Referer'),
      userId: (request as any).user?.id,
      organizationId:
        request.get('X-Tenant-ID') || (request as any).user?.organizationId,
      timestamp: new Date().toISOString(),
    };

    // Log request with security context
    if (metadata?.auditLog || metadata?.sensitiveOperation) {
      logger.audit(
        `Request started: ${request.method} ${request.url}`,
        securityInfo.userId,
        {
          ...securityInfo,
          sensitive: metadata?.sensitiveOperation,
        }
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;

          // Log successful response
          if (metadata?.auditLog) {
            logger.audit(
              `Request completed: ${request.method} ${request.url}`,
              securityInfo.userId,
              {
                ...securityInfo,
                duration,
                statusCode: response.statusCode,
                success: true,
              }
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
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0] ||
      request.get('X-Real-IP') ||
      request.get('X-Client-IP') ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeResponseData(data: any): void {
    // Remove sensitive information from response logs
    if (typeof data === 'object' && data !== null) {
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'otp',
        'ssn',
      ];

      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }

        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some((field) => lowerKey.includes(field))) {
              sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
              sanitized[key] = sanitize(value);
            } else {
              sanitized[key] = value;
            }
          }
          return sanitized;
        }

        return obj;
      };

      return sanitize(data);
    }
  }

  private logSecurityError(error: any, context: any): void {
    const securityRelevantErrors = [
      'UnauthorizedError',
      'ForbiddenError',
      'RateLimitExceeded',
      'CSRFError',
      'ValidationError',
    ];

    const isSecurityError =
      securityRelevantErrors.includes(error.constructor.name) ||
      error.status === 401 ||
      error.status === 403 ||
      error.status === 429;

    if (isSecurityError) {
      logger.security('Security error occurred', {
        ...context,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.error('Request error occurred', error);
    }
  }
}
