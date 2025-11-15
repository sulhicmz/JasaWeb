import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorHandlingService } from '../services/error-handling.service';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class ComprehensiveExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ComprehensiveExceptionFilter.name);

  constructor(
    @Optional()
    private errorHandlingService?: ErrorHandlingService
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique error ID for tracking
    const errorId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseObj = exception.getResponse();

      if (typeof responseObj === 'object' && responseObj !== null) {
        message = (responseObj as any).message || exception.message || message;
        error =
          (responseObj as any).error || exception.constructor.name || error;
      } else {
        message = (responseObj as string) || exception.message || message;
        error = exception.constructor.name || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
    }

    // Get user and organization context if available
    const user = (request as any).user?.id || (request as any).user?._id;
    const organizationId = (request as any).organizationId;

    // Log the error if we have the error handling service
    if (this.errorHandlingService) {
      this.errorHandlingService
        .logError({
          errorId,
          user,
          organization: organizationId,
          error,
          message,
          stack: exception instanceof Error ? exception.stack : undefined,
          path: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        })
        .catch((err) => {
          this.logger.error('Error logging failed', err);
        });
    }

    // Create a standardized error response
    const errorResponse = {
      statusCode: status,
      error,
      message,
      errorId, // Include error ID for tracking
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
