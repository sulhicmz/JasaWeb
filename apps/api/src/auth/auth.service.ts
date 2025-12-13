import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordService, PasswordHashVersion } from './password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private passwordService: PasswordService
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
    const { hash: hashedPassword, version: hashVersion } =
      await this.passwordService.hashPassword(createUserDto.password);

    // Create the user
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Generate JWT token and refresh token
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(user.id);

    return {
      access_token: token,
      refreshToken: refreshToken, // Send the full refresh token as returned by the service
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
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

    // Generate JWT token and refresh token
    const { token, refreshToken, expiresAt } =
      await this.refreshTokenService.createRefreshToken(user.id);

    return {
      access_token: token,
      refreshToken: refreshToken, // Send the full refresh token as returned by the service
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
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
