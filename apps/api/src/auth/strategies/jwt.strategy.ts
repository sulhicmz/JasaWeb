import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required. ' +
          'Please set a secure JWT secret (minimum 32 characters).'
      );
    }

    if (jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security. ' +
          `Current length: ${jwtSecret.length}`
      );
    }

    if (
      jwtSecret === 'generate-32-character-random-string-here' ||
      jwtSecret === 'default_secret' ||
      jwtSecret.includes('example') ||
      jwtSecret.includes('placeholder')
    ) {
      throw new Error(
        'JWT_SECRET appears to be using a placeholder or example value. ' +
          'Please generate a secure random secret for production use.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JWT Strategy initialized with secure secret validation');
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return user without password
    const { password, ...result } = user;
    return result;
  }
}
