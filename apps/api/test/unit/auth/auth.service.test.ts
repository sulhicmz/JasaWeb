import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordService } from './password.service';
import { PrismaService } from '../common/database/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import {
  createMockUserService,
  createMockJwtService,
  createMockRefreshTokenService,
  createMockPasswordService,
  createMockPrismaService,
  createMockUser,
  clearAllMocks,
} from '@jasaweb/testing';

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let refreshTokenService: RefreshTokenService;

  const mockUser = createMockUser({
    id: '1',
    password: 'test-hash-pass',
    passwordHashVersion: 'argon2id',
  });

  const mockUserService = createMockUserService([
    'findByEmail',
    'create',
    'hashPassword',
  ]);
  const mockJwtService = createMockJwtService();
  const mockRefreshTokenService = createMockRefreshTokenService();
  const mockPasswordService = createMockPasswordService();
  const mockPrismaService = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Manually set the private dependencies due to injection issues
    (service as any).usersService = mockUserService;
    (service as any).jwtService = mockJwtService;
    (service as any).refreshTokenService = mockRefreshTokenService;
    (service as any).passwordService = mockPasswordService;
    (service as any).prisma = mockPrismaService;

    usersService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'test-pass-123',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockPasswordService.hashPassword.mockResolvedValue({
        hash: 'test-hash-pass',
        version: 'argon2id',
      });
      mockPrismaService.membership.findFirst.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue({
        id: 'org-1',
        name: "Test User's Organization",
        billingEmail: 'test@example.com',
      });
      mockPrismaService.membership.create.mockResolvedValue({});
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(createUserDto.email);
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'test-pass-123',
      organizationId: 'org-1',
    };

    it('should successfully login user', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });
      mockPrismaService.membership.findFirst.mockResolvedValue({
        id: 'membership-1',
        userId: mockUser.id,
        organizationId: loginUserDto.organizationId,
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginUserDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({
        isValid: false,
        needsRehash: false,
      });

      await expect(service.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({
        isValid: false,
        needsRehash: false,
      });

      const result = await service.validateUser(
        'test@example.com',
        'wrong-test-pass'
      );

      expect(result).toBeNull();
    });
  });
});
