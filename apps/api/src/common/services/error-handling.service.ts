import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';

export interface ErrorLogData {
  errorId?: string;
  user?: string;
  organization?: string;
  error: string;
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  constructor(private auditService: AuditService) {}

  /**
   * Logs an error with comprehensive details
   */
  async logError(errorLogData: ErrorLogData): Promise<void> {
    const { error, message, user, organization, path } = errorLogData;
    
    // Log to application logger
    this.logger.error({
      error,
      message,
      stack: errorLogData.stack,
      user: user || 'unknown',
      organization: organization || 'unknown',
      path: path || 'unknown',
      ip: errorLogData.ip,
      userAgent: errorLogData.userAgent,
    });

    // Log to audit trail if possible
    if (user && organization) {
      try {
        await this.auditService.log({
          actorId: user,
          organizationId: organization,
          action: `error_${error.toLowerCase().replace(/\s+/g, '_')}`,
          target: 'System',
          targetId: errorLogData.errorId,
          meta: {
            errorMessage: message,
            errorType: error,
            path: path,
            method: errorLogData.method,
            ip: errorLogData.ip,
            userAgent: errorLogData.userAgent,
          },
        });
      } catch (auditError) {
        // If audit logging fails, log to console but don't break execution
        this.logger.warn(`Failed to log to audit trail: ${auditError.message}`);
      }
    }
  }

  /**
   * Creates a standardized error response object
   */
  createErrorResponse(statusCode: number, error: string, message: string, path?: string, errorId?: string): any {
    const response: any = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
    };

    if (path) {
      response.path = path;
    }

    if (errorId) {
      response.errorId = errorId;
    }

    return response;
  }
}