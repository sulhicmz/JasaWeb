import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { RefreshTokenService } from './refresh-token.service';
import type { Request as ExpressRequest } from 'express';
import type { User } from '@prisma/client';

type AuthenticatedRequest = ExpressRequest & { user?: Omit<User, 'password'> };

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService
  ) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; profilePicture?: string };
  }> {
    return await this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<{
    access_token: string;
    refreshToken: string;
    expiresAt: Date;
    user: { id: string; email: string; name: string; profilePicture?: string };
  }> {
    return await this.authService.login(loginUserDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<{
    statusCode: number;
    message: string;
    data?: {
      token: string;
      refreshToken: string;
      expiresAt: Date;
    };
  }> {
    if (!refreshToken) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token is required',
      };
    }

    try {
      const result =
        await this.refreshTokenService.rotateRefreshToken(refreshToken);
      if (!result) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid refresh token',
        };
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          token: result.token,
          refreshToken: result.newRefreshToken,
          expiresAt: result.expiresAt,
        },
      };
    } catch {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
      };
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string): Promise<{
    statusCode: number;
    message: string;
  }> {
    if (!refreshToken) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Refresh token is required',
      };
    }

    try {
      // Extract tokenIdentifier from the refresh token
      const [tokenIdentifier] = refreshToken.split('.');
      if (!tokenIdentifier) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid refresh token format',
        };
      }

      await this.refreshTokenService.revokeRefreshToken(tokenIdentifier);
      return {
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully',
      };
    } catch {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
      };
    }
  }

  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user ?? null;
  }
}
