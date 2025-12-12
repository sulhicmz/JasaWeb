import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestWithAuth } from '../types/request';

/**
 * Middleware to set the organization context for multi-tenant architecture
 * This middleware runs after JWT authentication and extracts organization context
 * from the authenticated user object that was set by the JWT strategy
 */
@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MultiTenantMiddleware.name);

  use(req: RequestWithAuth, _res: Response, next: NextFunction) {
    // The JWT strategy now sets organization context on the user object
    // We need to transfer it to the request level for easy access
    if (req.user && req.user.organizationId) {
      req.organizationId = req.user.organizationId;
      req.organization = req.user.organization;

      this.logger.debug(
        `Organization context set: ${req.organizationId} for user: ${req.user.id}`
      );
    } else {
      this.logger.warn('No organization context found in authenticated user');
    }

    next();
  }
}
