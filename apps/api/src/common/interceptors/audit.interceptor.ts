import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../services/audit.service';

export interface AuditLogOptions {
  action: string;
  target?: string;
}

// Decorator to mark endpoints that should be audited
export const AuditLog = (options: AuditLogOptions) =>
  Reflector.createDecorator<AuditLogOptions>()(options);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const options = this.reflector.get<AuditLogOptions>(
      'audit',
      context.getHandler()
    );

    // If no audit options are defined for this endpoint, skip auditing
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get user and organization context
    const user = request.user;
    const organizationId = (request as any).organizationId;

    // Only proceed with audit if we have user and organization context
    if (user && organizationId) {
      // Log the action before the request is handled
      this.auditService
        .log({
          actorId: user.id,
          organizationId,
          action: options.action,
          target: options.target,
          targetId: this.extractTargetId(request, options.target), // Extract the ID of the target entity
        })
        .catch((err) => {
          this.logger.error(`Failed to log audit event: ${err.message}`);
        });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          // Additional logging after successful execution if needed
        },
        error: (error) => {
          // Log errors if needed
          this.logger.error(
            `Error in audited action ${options.action}: ${error.message}`
          );
        },
      })
    );
  }

  private extractTargetId(
    request: any,
    targetType?: string
  ): string | undefined {
    // Extract target ID based on the request parameters
    // This can be customized based on your route structure
    if (request.params && request.params.id) {
      // If there's a specific ID in the route params
      return request.params.id;
    }

    // For creation actions, we might have the ID in the response
    // which we can't access in the interceptor, so we'll return undefined
    // and handle it differently if needed

    // For specific cases, we can customize further
    switch (targetType) {
      case 'File':
        return request.params.fileId || request.body.fileId;
      case 'Project':
        return request.params.projectId || request.body.projectId;
      case 'Ticket':
        return request.params.ticketId || request.body.ticketId;
      default:
        return undefined;
    }
  }
}
