import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshTokenService } from './refresh-token.service';
import { AccountLockoutService } from './account-lockout.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private accountLockoutService: AccountLockoutService
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: any; email: any; name: any; profilePicture: any };
  }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

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
    user: { id: any; email: any; name: any; profilePicture: any };
  }> {
    // Check if account is locked
    const isLocked = await this.accountLockoutService.isAccountLocked(
      loginUserDto.email
    );
    if (isLocked) {
      const lockoutStatus = await this.accountLockoutService.getLockoutStatus(
        loginUserDto.email
      );
      throw new UnauthorizedException(
        `Account is temporarily locked. Try again after ${lockoutStatus.lockoutExpiresAt?.toLocaleString()}`
      );
    }

    const user = await this.usersService.findByEmail(loginUserDto.email);
    if (!user) {
      await this.accountLockoutService.handleFailedLogin(loginUserDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password
    );
    if (!isPasswordValid) {
      await this.accountLockoutService.handleFailedLogin(loginUserDto.email);
      const lockoutStatus = await this.accountLockoutService.getLockoutStatus(
        loginUserDto.email
      );
      if (lockoutStatus.remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Invalid credentials. ${lockoutStatus.remainingAttempts} attempts remaining.`
        );
      } else {
        throw new UnauthorizedException(
          'Account is temporarily locked due to too many failed attempts.'
        );
      }
    }

    // Successful login - reset failed attempts
    await this.accountLockoutService.handleSuccessfulLogin(loginUserDto.email);

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

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
