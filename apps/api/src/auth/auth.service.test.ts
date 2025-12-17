import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { vi } from 'vitest';

// Mock bcrypt
const mockHash = vi.fn();
const mockCompare = vi.fn();

vi.mock('bcrypt', () => ({
  hash: mockHash,
  compare: mockCompare,
}));

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let refreshTokenService: RefreshTokenService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'test-hash-pass',
    profilePicture: null,
  };

  const mockUsersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  const mockRefreshTokenService = {
    createRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
      });

      mockHash.mockResolvedValue('test-hash-pass');

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(createUserDto.email);
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

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
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
      });

      mockCompare.mockResolvedValue(true);

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginUserDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      mockCompare.mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      mockCompare.mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      mockCompare.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-test-pass'
      );

      expect(result).toBeNull();
    });
  });
});
