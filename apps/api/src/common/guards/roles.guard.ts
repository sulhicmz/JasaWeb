import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { RequestWithAuth } from '../types/request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // If no roles required, allow access
    }

    // Get the request object
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user; // This would come from JWT strategy after auth

    if (!user) {
      throw new UnauthorizedException('Access denied. User not authenticated.');
    }

    // Extract organizationId from the request (set by our multi-tenant middleware)
    const organizationId = request.organizationId;

    if (!organizationId) {
      throw new ForbiddenException(
        'Access denied. Organization context not found.'
      );
    }

    // Get the user's role in the organization
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Access denied. User does not belong to this organization.'
      );
    }

    // Check if user's role is in the required roles
    const hasRequiredRole = requiredRoles.some(
      (role) => role === membership.role
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
