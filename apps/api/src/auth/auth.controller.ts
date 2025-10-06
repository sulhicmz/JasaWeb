import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { RefreshTokenService } from './refresh-token.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token is required',
      };
    }

    try {
      const result = await this.refreshTokenService.rotateRefreshToken(refreshToken);
      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          token: result.token,
          refreshToken: result.newRefreshToken,
          expiresAt: result.expiresAt,
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
      };
    }
  }

  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
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
    } catch (error) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
      };
    }
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}