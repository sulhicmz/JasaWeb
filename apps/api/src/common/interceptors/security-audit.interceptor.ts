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

/**
 * Security Audit Interceptor
 * Logs security-relevant events for audit purposes
 */
@Injectable()
export class SecurityAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityAuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const user = (request as any).user;
    const tenantId = headers['x-tenant-id'];

    const securityContext = {
      timestamp: new Date().toISOString(),
      method,
      url,
      ip,
      userAgent,
      userId: user?.id || 'anonymous',
      tenantId: tenantId || 'none',
      action: this.getActionFromContext(context),
    };

    // Log the security event
    this.logger.log(`Security Event: ${JSON.stringify(securityContext)}`);

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          this.logger.log(
            `Security Event Completed: ${method} ${url} - ${duration}ms - Success`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `Security Event Failed: ${method} ${url} - ${duration}ms - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * Extract action name from execution context
   */
  private getActionFromContext(context: ExecutionContext): string {
    const handler = context.getHandler();
    const controller = context.getClass();
    return `${controller.name}.${handler.name}`;
  }
}
