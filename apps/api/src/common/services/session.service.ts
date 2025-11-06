import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface SessionOptions {
  expiresIn?: string; // e.g., '1d', '7d', '30m'
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Creates a new session for a user
   */
  async createSession(userId: string, options: SessionOptions = {}): Promise<{ sessionId: string, sessionToken: string, expiresAt: Date }> {
    const sessionToken = uuidv4();
    const expiresAt = this.parseExpiresIn(options.expiresIn || '1d');

    // Create the session in the database
    const session = await this.prisma.session.create({
      data: {
        sessionToken,
        userId,
        expiresAt,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
      },
    });

    this.logger.log(`Created new session for user ${userId}`);

    return {
      sessionId: session.id,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Verifies a session token and returns user info if valid
   */
  async verifySession(sessionToken: string): Promise<{ userId: string, sessionId: string } | null> {
    if (!sessionToken) {
      return null;
    }

    // Find the session in the database
    const session = await this.prisma.session.findUnique({
      where: { 
        sessionToken,
      },
      include: {
        user: true,
      },
    });

    // Check if session exists and is not expired or revoked
    if (!session || session.expiresAt < new Date() || session.revokedAt) {
      this.logger.warn(`Invalid session token provided`);
      return null;
    }

    this.logger.log(`Valid session found for user ${session.userId}`);

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  }

  /**
   * Revokes a session (logout)
   */
  async revokeSession(sessionToken: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { 
        sessionToken,
      },
    });

    if (!session) {
      this.logger.warn(`Attempt to revoke non-existent session`);
      throw new UnauthorizedException('Invalid session');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    
    this.logger.log(`Revoked session for user ${session.userId}`);
  }

  /**
   * Revokes all sessions for a user (complete logout)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    
    this.logger.log(`Revoked all sessions for user ${userId}`);
  }

  /**
   * Cleans up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired/revoked sessions`);
    return result.count;
  }

  /**
   * Gets all active sessions for a user
   */
  async getUserSessions(userId: string) {
    return await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gte: new Date() }, // Only non-expired sessions
        revokedAt: null, // Only non-revoked sessions
      },
      select: {
        id: true,
        sessionToken: false, // Don't return the actual token for security
        createdAt: true,
        expiresAt: true,
        userAgent: true,
        ipAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Parses the expiresIn string into a Date
   */
  private parseExpiresIn(expiresIn: string): Date {
    const matches = expiresIn.match(/^(\d+)([smhd])$/);
    if (!matches) {
      throw new Error('Invalid expiresIn format');
    }

    const [, rawValue, unit] = matches;
    const value = Number.parseInt(rawValue ?? '', 10);
    if (Number.isNaN(value) || !unit) {
      throw new Error('Invalid expiresIn format');
    }

    const now = new Date();
    switch (unit) {
      case 's': // seconds
        return new Date(now.getTime() + value * 1000);
      case 'm': // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd': // days
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid expiresIn unit');
    }
  }
}