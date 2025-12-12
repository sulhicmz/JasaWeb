import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the first membership for the user
    // In a real implementation, you might want to handle multiple organizations
    // or allow organization selection via header/subdomain
    const activeMembership = user.memberships[0];

    if (!activeMembership) {
      throw new Error('User does not belong to any organization');
    }

    // Return user without password but with organization context
    const { password, memberships, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      organizationId: activeMembership.organizationId,
      organization: activeMembership.organization,
      role: activeMembership.role,
    };
  }
}
