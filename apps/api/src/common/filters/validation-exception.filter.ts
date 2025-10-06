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
    let errors = [];

    if (typeof responseObj === 'object') {
      const validationErrors = (responseObj as any).message;
      
      if (Array.isArray(validationErrors)) {
        errors = validationErrors.map((err: any) => {
          if (typeof err === 'object' && err !== null) {
            return {
              field: err.property,
              message: err.constraints ? Object.values(err.constraints)[0] : 'Validation error',
              value: err.value,
            };
          }
          return { message: err };
        });
      } else {
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