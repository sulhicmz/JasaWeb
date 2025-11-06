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
    const errors: Array<Record<string, unknown>> = [];

    if (typeof responseObj === 'object' && responseObj !== null) {
      const validationErrors = (responseObj as any).message;

      if (Array.isArray(validationErrors)) {
        validationErrors.forEach((err: any) => {
          if (typeof err === 'object' && err !== null) {
            errors.push({
              field: err.property,
              message: err.constraints ? Object.values(err.constraints)[0] : 'Validation error',
              value: err.value,
            });
          } else if (typeof err === 'string') {
            errors.push({ message: err });
          }
        });
      } else if (typeof validationErrors === 'string') {
        message = validationErrors;
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