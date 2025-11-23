import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MultiTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if organization context is set
    if (!request.organizationId) {
      // Use generic forbidden message to avoid leaking system information
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
