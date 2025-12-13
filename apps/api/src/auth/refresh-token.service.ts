import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  /**
   * Creates a new refresh token for a user
   */
  async createRefreshToken(
    userId: string,
    expiresIn: string = '7d'
  ): Promise<{ token: string; refreshToken: string; expiresAt: Date }> {
    // Generate a unique refresh token and a separate identifier for lookups
    const refreshToken = uuidv4();
    const tokenIdentifier = uuidv4(); // This will be used for lookups without compromising security
    const expiresAt = this.parseExpiresIn(expiresIn);

    // Hash the actual refresh token before storing it for security
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // Store the refresh token in the database
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: tokenHash, // Hashed token for security
        tokenIdentifier: tokenIdentifier, // Identifier for lookups
        userId,
        expiresAt,
      },
    });

    // Generate a new JWT access token
    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Created new refresh token for user ${userId}`);

    // Return the combination of tokenIdentifier and actual token for client use
    return {
      token: accessToken,
      refreshToken: `${tokenIdentifier}.${refreshToken}`, // Combine identifier and token for client
      expiresAt,
    };
  }

  /**
   * Verifies a refresh token and returns a new access token if valid
   */
  async rotateRefreshToken(refreshToken: string): Promise<{
    token: string;
    newRefreshToken: string;
    expiresAt: Date;
  } | null> {
    // The approach: we need to find the token record in the DB.
    // To do this securely, we can't directly query bcrypt hashes.
    // Instead, we'll use the tokenIdentifier that's stored in plaintext to find the record,
    // then verify the actual token matches the hash.

    // However, there's a security issue with this: if the tokenIdentifier is compromised,
    // it can be used to identify the record, and then an attacker could try to guess
    // the actual token value.

    // A better approach: Instead of sending the tokenIdentifier separately,
    // let's structure the token itself to contain both parts.
    // In a real implementation, you'd likely use a more sophisticated approach.

    // For this implementation, I'll use a different method:
    // The client sends the tokenIdentifier as the refreshToken value
    // and we use that to look up the record, then compare the actual token value
    // that's sent separately or embedded.

    // Actually, let's approach this differently:
    // We'll send the tokenIdentifier to the client (not the full token)
    // and store the full token hash separately.

    // No, that's not right either. A standard approach is:
    // 1. Generate a random token
    // 2. Store a hash of the token in the DB
    // 3. Send the unhashed token to the client
    // 4. When the client sends the token back, hash it and compare with stored hash

    // But this means we can't directly query the DB for the token.
    // The solution is to use a lookup field that's not the sensitive token itself.

    // Let's modify our approach:
    // - Send the tokenIdentifier to the client
    // - Store the full token hash in DB
    // - When client sends tokenIdentifier back, we fetch the record
    // - Then client also sends the full token value, which we hash and compare

    // Actually, I think the standard approach is to send the full token to the client,
    // and when they send it back, we hash it and compare with the stored hash.
    // The issue is how to efficiently find the right DB record to compare with.

    // The solution is to create a separate identifier that can be used for lookups,
    // like a UUID, and then store the hash of the actual refresh token.
    // The client would send both (or we embed them in the token structure).

    // Let me implement the correct standard pattern:
    // 1. Create a random refresh token (uuid)
    // 2. Store a hash of it in the DB along with a lookup identifier
    // 3. Send the full token to the client
    // 4. When validating, client sends token, we find by identifier, then verify hash

    // Actually, let me reconsider. The most common approach is:
    // - Store a UUID as the lookup key
    // - Store the hashed full token value
    // - Send both to the client (or embed in JWT)
    // - Client sends both back
    // - Find record by UUID, then verify the actual token matches hash

    // For our implementation, let's have the client send the tokenIdentifier only,
    // and then they also send the full token in the request body, header, or embedded in JWT.

    // To keep it simple but secure, I'll implement this way:
    // 1. Client stores both the tokenIdentifier and actual refreshToken
    // 2. On refresh, client sends both values (tokenIdentifier + refreshToken)
    // 3. We use tokenIdentifier to find the DB record, then compare hashes

    // Since it's not practical to send 2 values, let's encode them into one:
    // tokenIdentifier.refreshToken

    const [tokenIdentifier, actualToken] = refreshToken.split('.');
    if (!tokenIdentifier || !actualToken) {
      this.logger.warn('Invalid refresh token format provided');
      throw new UnauthorizedException('Invalid refresh token format');
    }

    // Find the token record by identifier
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenIdentifier },
    });

    if (!storedToken) {
      this.logger.warn('Invalid refresh token identifier provided');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if the token is expired
    if (storedToken.expiresAt < new Date()) {
      this.logger.warn('Expired refresh token provided');
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Expired refresh token');
    }

    // Check if the token has been revoked
    if (storedToken.revokedAt) {
      this.logger.warn('Revoked refresh token provided');
      throw new UnauthorizedException('Revoked refresh token');
    }

    // Compare the provided token with the stored hash
    const tokenMatches = await bcrypt.compare(
      actualToken,
      storedToken.tokenHash
    );
    if (!tokenMatches) {
      this.logger.warn('Refresh token hash mismatch');
      // For security, revoke this token if the hash doesn't match
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get the user ID from the stored token
    const userId = storedToken.userId;

    // Revoke the old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Create a new refresh token
    const newTokens = await this.createRefreshToken(userId);

    this.logger.log(`Refresh token rotated for user ${userId}`);

    return {
      token: newTokens.token,
      newRefreshToken: newTokens.refreshToken,
      expiresAt: newTokens.expiresAt,
    };
  }

  /**
   * Revokes a refresh token (logout)
   */
  async revokeRefreshToken(tokenIdentifier: string): Promise<void> {
    // Find the token by identifier and revoke it
    const token = await this.prisma.refreshToken.findUnique({
      where: {
        tokenIdentifier: tokenIdentifier,
      },
    });

    if (!token) {
      this.logger.warn('Attempt to revoke non-existent refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Revoked refresh token for user ${token.userId}`);
  }

  /**
   * Revokes all refresh tokens for a user (complete logout)
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Revoked all refresh tokens for user ${userId}`);
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
