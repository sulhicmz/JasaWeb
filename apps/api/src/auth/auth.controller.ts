import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  AuthResponseDto,
  RefreshTokenDto,
  ErrorResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { RefreshTokenService } from './refresh-token.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';

type AuthenticatedRequest = ExpressRequest & { user?: unknown };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and returns authentication tokens',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    return await this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns JWT tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto): Promise<any> {
    return await this.authService.login(loginUserDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Rotates refresh token and returns new access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Token refreshed successfully' },
        data: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            expiresAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body('refreshToken') refreshToken: string): Promise<any> {
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
    } catch (error) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
      };
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Revokes the refresh token and logs out the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Refresh token required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RefreshTokenDto })
  async logout(@Body('refreshToken') refreshToken: string): Promise<any> {
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: "Returns the current authenticated user's profile information",
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user_123' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        profilePicture: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user ?? null;
  }
}
