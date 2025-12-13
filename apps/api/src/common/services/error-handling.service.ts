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
      } catch (error: unknown) {
        this.logger.error(
          `Failed to create audit log for error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }
  }

  /**
   * Creates a standardized error response object
   */
  createErrorResponse(
    statusCode: number,
    error: string,
    message: string,
    path?: string,
    errorId?: string
  ): {
    statusCode: number;
    error: string;
    message: string;
    timestamp: string;
    path?: string;
    errorId?: string;
  } {
    const response: {
      statusCode: number;
      error: string;
      message: string;
      timestamp: string;
      path?: string;
      errorId?: string;
    } = {
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
