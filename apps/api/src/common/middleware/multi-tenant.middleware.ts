import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OrganizationMembershipService } from '../services/organization-membership.service';

interface EnhancedRequest extends Omit<Request, 'user'> {
  organizationId: string;
  organization: unknown;
  userId: string;
  user: unknown;
  membership: {
    id: string;
    role: string;
  };
}

@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MultiTenantMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private membershipService: OrganizationMembershipService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No authorization token provided');
      }

      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token);

      if (!payload.sub || !payload.organizationId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub;
      const organizationId = payload.organizationId;

      // Verify membership using the dedicated service
      const membershipContext = await this.membershipService.verifyMembership(
        userId,
        organizationId
      );

      // Attach organization and user context to request
      (req as EnhancedRequest).organizationId =
        membershipContext.organizationId;
      (req as EnhancedRequest).organization = membershipContext.organization;
      (req as EnhancedRequest).userId = membershipContext.userId;
      (req as EnhancedRequest).user = membershipContext.user;
      (req as EnhancedRequest).membership = {
        id: 'membership-id', // Would be actual membership ID
        role: membershipContext.role,
      };

      this.logger.debug(
        `User ${userId} accessing organization ${organizationId} (${membershipContext.role})`
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For JWT verification errors or other issues
      this.logger.error('Error in multi-tenant middleware', error);
      throw new UnauthorizedException('Invalid authentication token');
    }

    next();
  }
}
