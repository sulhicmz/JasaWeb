import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordService, PasswordHashVersion } from './password.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private passwordService: PasswordService,
    private prisma: PrismaService
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; profilePicture?: string };
  }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash the password
    const { hash: hashedPassword } = await this.passwordService.hashPassword(
      createUserDto.password
    );

    // Create the user
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // For registration, we'll use the first organization or create a default one
    // This is a simplified approach - in production, you might want a separate organization creation flow
    let organizationId: string;

    // Check if user has any existing memberships
    const existingMembership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });

    if (existingMembership) {
      organizationId = existingMembership.organizationId;
    } else {
      // Create a default organization for the user
      const newOrg = await this.prisma.organization.create({
        data: {
          name: `${user.name || user.email}'s Organization`,
          billingEmail: user.email,
        },
      });

      // Create owner membership
      await this.prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: newOrg.id,
          role: 'owner',
        },
      });

      organizationId = newOrg.id;
    }

    // Generate JWT token and refresh token
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(
        user.id,
        organizationId
      );

    return {
      access_token: token,
      refreshToken: refreshToken, // Send the full refresh token as returned by the service
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        profilePicture: user.profilePicture || undefined,
      },
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; profilePicture?: string };
  }> {
    const user = await this.usersService.findByEmail(loginUserDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordResult = await this.passwordService.verifyPassword(
      loginUserDto.password,
      user.password,
      user.passwordHashVersion as PasswordHashVersion
    );

    if (!passwordResult.isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update password hash if migration is needed
    if (
      passwordResult.needsRehash &&
      passwordResult.newHash &&
      passwordResult.newVersion
    ) {
      await this.usersService.updatePasswordHash(
        user.id,
        passwordResult.newHash,
        passwordResult.newVersion
      );
    }

    // Verify user has membership in the specified organization
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: loginUserDto.organizationId,
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'User is not a member of this organization'
      );
    }

    // Generate JWT token and refresh token with organization context
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(
        user.id,
        loginUserDto.organizationId
      );

    return {
      access_token: token,
      refreshToken: refreshToken, // Send the full refresh token as returned by the service
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        profilePicture: user.profilePicture || undefined,
      },
    };
  }

  async validateUser(
    email: string,
    pass: string
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const passwordResult = await this.passwordService.verifyPassword(
        pass,
        user.password,
        user.passwordHashVersion as PasswordHashVersion
      );

      if (passwordResult.isValid) {
        // Update password hash if migration is needed
        if (
          passwordResult.needsRehash &&
          passwordResult.newHash &&
          passwordResult.newVersion
        ) {
          await this.usersService.updatePasswordHash(
            user.id,
            passwordResult.newHash,
            passwordResult.newVersion
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }
}
