import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordService } from './password.service';
import { PrismaService } from '../common/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('AuthService - Multi-tenant Authentication', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;
  let passwordService: PasswordService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    passwordHashVersion: 'bcrypt',
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Organization',
    billingEmail: 'test@example.com',
    plan: null,
    settings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    id: 'membership-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockRefreshTokenService = {
      createRefreshToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const mockPasswordService = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        create: jest.fn(),
      },
      membership: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    passwordService = module.get<PasswordService>(PasswordService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('login with multi-tenant support', () => {
    it('should successfully login user with valid organization membership', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordService.verifyPassword = jest.fn().mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });
      prisma.membership.findFirst = jest.fn().mockResolvedValue(mockMembership);
      refreshTokenService.createRefreshToken = jest.fn().mockResolvedValue({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.verifyPassword).toHaveBeenCalled();
      expect(prisma.membership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          organizationId: 'org-1',
        },
      });
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'org-1'
      );
      expect(result).toEqual({
        access_token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: expect.any(Date),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          profilePicture: undefined,
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
        organizationId: 'org-1',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordService.verifyPassword = jest.fn().mockResolvedValue({
        isValid: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user is not member of specified organization', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: 'org-2', // Different organization
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordService.verifyPassword = jest.fn().mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });
      prisma.membership.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should include organizationId in JWT token payload', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: 'org-1',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordService.verifyPassword = jest.fn().mockResolvedValue({
        isValid: true,
        needsRehash: false,
      });
      prisma.membership.findFirst = jest.fn().mockResolvedValue(mockMembership);

      // Mock JWT service to capture the payload
      let capturedPayload: any = null;
      const mockSignAsync = jest.fn().mockImplementation((payload) => {
        capturedPayload = payload;
        return 'jwt-token-with-org';
      });
      jwtService.signAsync = mockSignAsync;

      // Mock refresh token service to call JWT service
      refreshTokenService.createRefreshToken = jest
        .fn()
        .mockImplementation((userId, organizationId) => {
          // Verify that organizationId is passed correctly
          expect(organizationId).toBe('org-1');
          // Call the JWT service to create the token
          const token = mockSignAsync({ sub: userId, organizationId });
          return Promise.resolve({
            token,
            refreshToken: 'refresh-token',
            expiresAt: new Date(),
          });
        });

      await service.login(loginDto);

      // Verify the JWT service was called with organization context
      expect(capturedPayload).toEqual({
        sub: 'user-1',
        organizationId: 'org-1',
      });
    });
  });

  describe('register with automatic organization creation', () => {
    it('should create user and default organization if no existing membership', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const newUser = {
        ...mockUser,
        email: 'newuser@example.com',
        name: 'New User',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(null);
      passwordService.hashPassword = jest.fn().mockResolvedValue({
        hash: 'hashedPassword',
      });
      usersService.create = jest.fn().mockResolvedValue(newUser);
      prisma.membership.findFirst = jest.fn().mockResolvedValue(null); // No existing membership
      prisma.organization.create = jest.fn().mockResolvedValue({
        ...mockOrganization,
        name: "New User's Organization",
        billingEmail: 'newuser@example.com',
      });
      prisma.membership.create = jest.fn().mockResolvedValue(mockMembership);
      refreshTokenService.createRefreshToken = jest.fn().mockResolvedValue({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      await service.register(createUserDto);

      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: "New User's Organization",
          billingEmail: 'newuser@example.com',
        },
      });
      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          organizationId: 'org-1',
          role: 'owner',
        },
      });
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'org-1'
      );
    });

    it('should use existing organization if user already has membership', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existinguser@example.com',
        name: 'Existing User',
        password: 'password123',
      };

      usersService.findByEmail = jest.fn().mockResolvedValue(null);
      passwordService.hashPassword = jest.fn().mockResolvedValue({
        hash: 'hashedPassword',
      });
      usersService.create = jest.fn().mockResolvedValue(mockUser);
      prisma.membership.findFirst = jest.fn().mockResolvedValue(mockMembership); // Existing membership
      refreshTokenService.createRefreshToken = jest.fn().mockResolvedValue({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      await service.register(createUserDto);

      expect(prisma.organization.create).not.toHaveBeenCalled();
      expect(prisma.membership.create).not.toHaveBeenCalled();
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'org-1'
      );
    });
  });

  describe('JWT token validation', () => {
    it('should validate user with correct password and update hash if needed', async () => {
      usersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      passwordService.verifyPassword = jest.fn().mockResolvedValue({
        isValid: true,
        needsRehash: true,
        newHash: 'newHashedPassword',
        newVersion: 'argon2',
      });
      usersService.updatePasswordHash = jest.fn().mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHashVersion: 'bcrypt',
        profilePicture: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        'newHashedPassword',
        'argon2'
      );
    });
  });
});
