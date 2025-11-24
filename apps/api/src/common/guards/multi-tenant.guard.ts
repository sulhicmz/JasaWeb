import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestWithAuth } from '../types/request';

@Injectable()
export class MultiTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    // Check if organization context is set
    if (!request.organizationId) {
      // Use generic forbidden message to avoid leaking system information
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
