import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const responseObj = exception.getResponse();
    let message = 'Validation failed';
    let errors: string[] = [];

    if (typeof responseObj === 'object' && responseObj !== null) {
      const obj = responseObj as { message?: string | string[] };
      if (obj.message && Array.isArray(obj.message)) {
        errors = obj.message;
        if (errors.length > 0) {
          message = errors[0] || message;
        }
      }
    }

    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
