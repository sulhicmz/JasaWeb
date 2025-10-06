import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';

export interface SessionRequest extends Request {
  sessionId?: string;
  userId?: string;
}

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionMiddleware.name);

  constructor(private sessionService: SessionService) {}

  async use(req: SessionRequest, res: Response, next: NextFunction) {
    // Extract session token from header, cookie, or query param
    // Here we'll check for it in the Authorization header as a Bearer token
    // or in a custom header
    let sessionToken = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!sessionToken) {
      // Also check for it in a custom header
      sessionToken = req.headers['x-session-token'] as string;
    }

    if (!sessionToken) {
      // If no session token is provided, continue without session
      // (public routes can still be accessed)
      next();
      return;
    }

    try {
      // Verify the session token
      const sessionData = await this.sessionService.verifySession(sessionToken);
      
      if (!sessionData) {
        this.logger.warn(`Invalid session token for IP: ${req.ip}`);
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Add session data to request
      req.sessionId = sessionData.sessionId;
      req.userId = sessionData.userId;

      this.logger.log(`Session validated for user ${sessionData.userId}`);
      
      // Continue with the request
      next();
    } catch (error) {
      this.logger.error(`Session validation failed: ${error.message}`);
      throw new UnauthorizedException('Session validation failed');
    }
  }
}