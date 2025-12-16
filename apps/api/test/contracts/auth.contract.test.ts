import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '../../src/auth/refresh-token.service';
import { PasswordService } from '../../src/auth/password.service';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';
import { LoginUserDto } from '../../src/auth/dto/login-user.dto';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';

describe('AuthService API Contract Tests', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
    verifyAsync: vi.fn(),
  };

  const mockRefreshTokenService = {
    createRefreshToken: vi.fn(),
    validateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
  };

  const mockPasswordService = {
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
  };

  const mockMultiTenantPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    organizationMembership: {
      findMany: vi.fn(),
    },
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
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    vi.clearAllMocks();
  });

  describe('API Contract - POST /auth/login', () => {
    it('should return login response with correct contract', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        organizationId: 'org-1',
        passwordHashVersion: 'v1' as const,
      };

      const mockOrganization = {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
      };

      const mockMembership = {
        id: 'membership-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
      };

      // Mock user lookup
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Mock password verification
      mockPasswordService.verifyPassword.mockResolvedValue({ valid: true });

      // Mock token generation
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      // Mock organization lookup
      mockMultiTenantPrisma.organization.findUnique.mockResolvedValue(
        mockOrganization
      );

      // Mock membership lookup
      mockMultiTenantPrisma.organizationMembership.findMany.mockResolvedValue([
        mockMembership,
      ]);

      const result = await service.login(loginUserDto);

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('user');

      // Token contract
      expect(typeof result.access_token).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // User contract
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('profilePicture');

      expect(typeof result.user.id).toBe('string');
      expect(typeof result.user.email).toBe('string');
      expect(typeof result.user.name).toBe('string');

      // Verify user data matches expected structure
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        profilePicture: undefined,
      });
    });

    it('should reject login for non-existent user', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should reject login for invalid password', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'wrongpassword',
        organizationId: 'org-1',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        organizationId: 'org-1',
        passwordHashVersion: 'v1' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({ valid: false });

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('API Contract - POST /auth/register', () => {
    it('should return registration response with correct contract', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockUser = {
        id: 'user-2',
        email: 'newuser@example.com',
        name: 'New User',
        password: 'hashedPassword',
        organizationId: 'org-2',
        passwordHashVersion: 'v1' as const,
      };

      const mockOrganization = {
        id: 'org-2',
        name: 'New Organization',
        slug: 'new-org',
      };

      // Mock user creation
      mockUsersService.create.mockResolvedValue(mockUser);

      // Mock password hashing
      mockPasswordService.hashPassword.mockResolvedValue('hashedPassword');

      // Mock token generation
      mockRefreshTokenService.createRefreshToken.mockResolvedValue({
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      // Mock organization lookup
      mockMultiTenantPrisma.organization.findUnique.mockResolvedValue(
        mockOrganization
      );

      // Mock membership lookup
      mockMultiTenantPrisma.organizationMembership.findMany.mockResolvedValue([
        {
          id: 'membership-2',
          userId: 'user-2',
          organizationId: 'org-2',
          role: 'owner',
        },
      ]);

      const result = await service.register(createUserDto);

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('user');

      // Token contract
      expect(typeof result.access_token).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // User contract
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('profilePicture');

      expect(typeof result.user.id).toBe('string');
      expect(typeof result.user.email).toBe('string');
      expect(typeof result.user.name).toBe('string');

      // Verify user data matches expected structure
      expect(result.user).toEqual({
        id: 'user-2',
        email: 'newuser@example.com',
        name: 'New User',
        profilePicture: undefined,
      });
    });
  });

  describe('API Contract - User Validation', () => {
    it('should validate user credentials correctly', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        organizationId: 'org-1',
        passwordHashVersion: 'v1' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({ valid: true });

      const result = await service.validateUser(
        loginUserDto.email,
        loginUserDto.password
      );

      expect(result).toBeDefined();
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid credentials', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'wrongpassword',
        organizationId: 'org-1',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        loginUserDto.email,
        loginUserDto.password
      );

      expect(result).toBeNull();
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle database connection errors', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      mockUsersService.findByEmail.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle token generation errors', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        organizationId: 'org-1',
        passwordHashVersion: 'v1' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({ valid: true });
      mockRefreshTokenService.createRefreshToken.mockRejectedValue(
        new Error('Token generation failed')
      );

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Token generation failed'
      );
    });
  });

  describe('Data Validation Contract', () => {
    it('should validate email format', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'invalid-email',
        password: 'password123',
        organizationId: 'org-1',
      };

      // This should be handled by DTO validation, but we test service behavior
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should handle empty password', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'user@example.com',
        password: '',
        organizationId: 'org-1',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        organizationId: 'org-1',
        passwordHashVersion: 'v1' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue({ valid: false });

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });
});
