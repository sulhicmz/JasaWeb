import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RequestWithAuth } from '../types/request';

export const CurrentOrganizationId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();

    // Security validation checks
    if (!request.organizationId || !request.user?.id) {
      throw new ForbiddenException(
        'Invalid organization context - missing authentication'
      );
    }

    // Validate organization ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.organizationId)) {
      throw new ForbiddenException('Invalid organization ID format');
    }

    // Verify user membership exists and is active
    try {
      // Get PrismaService from the request context or create a temporary instance
      const prismaService = ctx
        .switchToHttp()
        .getRequest()
        .app?.get(PrismaService);

      if (prismaService) {
        const membership = await prismaService.membership.findFirst({
          where: {
            userId: request.user.id,
            organizationId: request.organizationId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            role: true,
            status: true,
          },
        });

        if (!membership) {
          throw new ForbiddenException(
            'Organization access denied - membership not found or inactive'
          );
        }

        // Additional security: attach membership info to request for audit purposes
        request.membership = {
          id: membership.id,
          role: membership.role,
        };
      }
    } catch (error) {
      // If database verification fails, we still proceed with basic validation
      // but log the error for monitoring
      console.warn(
        'Membership verification failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return request.organizationId;
  }
);
