import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedpassword',
    profilePicture: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokenResponse = {
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockRefreshTokenService = {
      createRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should successfully register a new user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      refreshTokenService.createRefreshToken.mockResolvedValue(mockTokenResponse);

      const result = await service.register(createUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).toHaveBeenCalled();
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        access_token: mockTokenResponse.token,
        refreshToken: mockTokenResponse.refreshToken,
        expiresAt: mockTokenResponse.expiresAt,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          profilePicture: mockUser.profilePicture,
        },
      });
    });

    it('should throw BadRequestException when user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(BadRequestException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should hash the password before creating user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      refreshTokenService.createRefreshToken.mockResolvedValue(mockTokenResponse);

      await service.register(createUserDto);

      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(createUserDto.password);
      expect(createCall.password).toMatch(/^\$2[aby]\$.{56}$/);
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      refreshTokenService.createRefreshToken.mockResolvedValue(mockTokenResponse);

      const result = await service.login(loginUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        access_token: mockTokenResponse.token,
        refreshToken: mockTokenResponse.refreshToken,
        expiresAt: mockTokenResponse.expiresAt,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          profilePicture: mockUser.profilePicture,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
