import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { SecurityConfigService } from '../../common/security/security-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private securityConfig: SecurityConfigService
  ) {
    const jwtConfig = securityConfig.getJwtConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    organizationId: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
  }) {
    // Validate token claims
    const jwtConfig = this.securityConfig.getJwtConfig();

    if (payload.iss !== jwtConfig.issuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    if (payload.aud !== jwtConfig.audience) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        memberships: {
          where: {
            organizationId: payload.organizationId,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.memberships || user.memberships.length === 0) {
      throw new UnauthorizedException(
        'User is not a member of this organization'
      );
    }

    // Return user without password and with membership context
    const membership = user.memberships[0]!; // Use the first membership (checked above)
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      membershipId: membership.id,
      organizationId: payload.organizationId,
      role: membership.role,
    };
  }
}
