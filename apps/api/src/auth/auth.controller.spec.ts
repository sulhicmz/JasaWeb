import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockRefreshTokenService = {
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const expectedResult = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle registration errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Email already exists')
      );

      await expect(controller.register(createUserDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginUserDto);

      expect(authService.login).toHaveBeenCalledWith(loginUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle invalid credentials', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResult = {
        token: 'new-jwt-token',
        newRefreshToken: 'new-refresh-token',
        expiresAt: new Date(),
      };

      mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshToken);

      expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          token: expectedResult.token,
          refreshToken: expectedResult.newRefreshToken,
          expiresAt: expectedResult.expiresAt,
        },
      });
    });

    it('should return error when refresh token is missing', async () => {
      const result = await controller.refresh('');

      expect(result).toEqual({
        statusCode: 401,
        message: 'Refresh token is required',
      });
    });

    it('should handle invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockRefreshTokenService.rotateRefreshToken.mockRejectedValue(
        new Error('Invalid token')
      );

      const result = await controller.refresh(refreshToken);

      expect(result).toEqual({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const refreshToken = 'identifier.payload.signature';

      mockRefreshTokenService.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await controller.logout(refreshToken);

      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith('identifier');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Logged out successfully',
      });
    });

    it('should return error when refresh token is missing', async () => {
      const result = await controller.logout('');

      expect(result).toEqual({
        statusCode: 400,
        message: 'Refresh token is required',
      });
    });

    it('should handle invalid refresh token format', async () => {
      const refreshToken = 'invalid-format';

      const result = await controller.logout(refreshToken);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Invalid refresh token format',
      });
    });

    it('should handle revoke token errors', async () => {
      const refreshToken = 'identifier.payload.signature';

      mockRefreshTokenService.revokeRefreshToken.mockRejectedValue(
        new Error('Token not found')
      );

      const result = await controller.logout(refreshToken);

      expect(result).toEqual({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockRequest = {
        user: mockUser,
      };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });
});