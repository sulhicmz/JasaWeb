import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { RequestWithAuth } from '../types/request';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MultiTenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    // Check if organization context is set
    if (!request.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user is authenticated
    if (!request.user?.id) {
      throw new ForbiddenException('Access denied');
    }

    // Verify user membership in the organization
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: request.user.id,
          organizationId: request.organizationId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    // Store membership info in request for later use
    request.membership = membership;

    return true;
  }
}
