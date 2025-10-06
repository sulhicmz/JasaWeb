import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../database/prisma.service';

/**
 * Middleware to set the organization context for multi-tenant architecture
 * This should be used in combination with request interceptors to ensure
 * all database queries are filtered by the current organization
 */
@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract organization from request - could be from:
    // 1. JWT token (sub -> user -> membership -> organization)
    // 2. Request header
    // 3. URL subdomain
    // 4. Request body/query params (for specific cases)

    // For now, we'll set it to the request object
    // In a real implementation, you would extract the user from JWT
    // and then fetch their organization via their membership
    const userId = req.headers['x-user-id']?.toString(); // This would come from JWT after auth

    if (userId) {
      try {
        // Find the organization the user belongs to
        const membership = await this.prisma.membership.findFirst({
          where: {
            userId: userId,
          },
          include: {
            organization: true,
          },
        });

        if (membership) {
          // Attach organization to request for use in controllers/services
          (req as any).organizationId = membership.organizationId;
          (req as any).organization = membership.organization;
        }
      } catch (error) {
        // If there's an error finding the organization, continue without organization context
        console.error('Error finding organization for user:', error);
      }
    }

    next();
  }
}