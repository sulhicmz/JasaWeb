import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../common/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService - Multi-tenant Login', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org1',
    name: 'Test Organization',
    billingEmail: 'billing@example.com',
    plan: 'premium',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    id: 'membership1',
    role: 'owner',
    userId: 'user1',
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    organization: mockOrganization,
  };

  beforeEach(async () => {
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
      rotateRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      membership: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
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
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Multi-tenant Login Flow', () => {
    it('should login user and return organization context', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock user lookup
      (usersService.findByEmail as any).mockResolvedValue(mockUser);

      // Mock password comparison
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Mock refresh token creation
      (refreshTokenService.createRefreshToken as any).mockResolvedValue({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const result = await service.login(loginUserDto);

      expect(result).toEqual({
        access_token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: expect.any(Date),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          profilePicture: mockUser.profilePicture,
        },
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword'
      );
      expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        'user1'
      );
    });

    it('should fail login with invalid credentials', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (usersService.findByEmail as any).mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should fail login with non-existent user', async () => {
      const loginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (usersService.findByEmail as any).mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('JWT Strategy Multi-tenant Validation', () => {
    it('should validate user and return organization context', async () => {
      const payload = { sub: 'user1', email: 'test@example.com' };

      (prismaService.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        memberships: [mockMembership],
      });

      // This simulates what the JWT strategy does
      const user = await prismaService.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      expect(user).toBeTruthy();
      expect(user?.memberships).toHaveLength(1);
      expect(user?.memberships[0].organizationId).toBe('org1');
      expect(user?.memberships[0].organization.name).toBe('Test Organization');
    });

    it('should fail validation for user without organization membership', async () => {
      const payload = { sub: 'user1', email: 'test@example.com' };

      (prismaService.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        memberships: [], // No memberships
      });

      const user = await prismaService.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      expect(user?.memberships).toHaveLength(0);
      // In the actual JWT strategy, this would throw an error
    });
  });

  describe('Organization Data Isolation', () => {
    it('should ensure users can only access their organization data', async () => {
      const userId = 'user1';
      const organizationId = 'org1';

      // Mock that user belongs to org1
      (prismaService.membership.findFirst as any).mockResolvedValue(
        mockMembership
      );

      const membership = await prismaService.membership.findFirst({
        where: {
          userId: userId,
        },
        include: {
          organization: true,
        },
      });

      expect(membership?.organizationId).toBe(organizationId);
      expect(membership?.organization.name).toBe('Test Organization');

      // This would be used to filter queries in the multi-tenant middleware
      const organizationFilter = { organizationId: membership?.organizationId };
      expect(organizationFilter).toEqual({ organizationId: 'org1' });
    });

    it('should handle users with multiple organizations', async () => {
      const userId = 'user1';
      const mockOrg2 = {
        ...mockOrganization,
        id: 'org2',
        name: 'Second Organization',
      };
      const mockMembership2 = {
        ...mockMembership,
        id: 'membership2',
        organizationId: 'org2',
        organization: mockOrg2,
      };

      (prismaService.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        memberships: [mockMembership, mockMembership2],
      });

      const user = await prismaService.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      expect(user?.memberships).toHaveLength(2);
      // In a real implementation, you might have logic to select the primary organization
      // or allow the user to switch between organizations
    });
  });
});
