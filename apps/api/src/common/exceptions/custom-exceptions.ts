import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(message: string, error_code?: string) {
    super(
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        error: error_code || 'BUSINESS_LOGIC_ERROR',
        message: message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `The requested ${resource} with ID ${id} was not found`
      : `The requested ${resource} was not found`;
      
    super(
      {
        status: HttpStatus.NOT_FOUND,
        error: 'RESOURCE_NOT_FOUND',
        message: message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UnauthorizedResourceAccessException extends HttpException {
  constructor(resource: string) {
    super(
      {
        status: HttpStatus.FORBIDDEN,
        error: 'UNAUTHORIZED_ACCESS',
        message: `You are not authorized to access this ${resource}`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}