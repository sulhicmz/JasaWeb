import { Test, TestingModule } from '@nestjs/testing';
import { AccountLockoutService } from './account-lockout.service';
import { PrismaService } from '../common/database/prisma.service';
import { addMinutes } from 'date-fns';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAttempt: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountLockoutService>(AccountLockoutService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFailedLogin', () => {
    it('should increment failed login attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1,
        lastLoginAttempt: new Date(),
      });

      await service.handleFailedLogin('test@example.com');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          failedLoginAttempts: 1,
          lastLoginAttempt: expect.any(Date),
          lockedUntil: null,
        },
      });
    });

    it('should lock account after max failed attempts', async () => {
      const userWithMaxAttempts = {
        ...mockUser,
        failedLoginAttempts: 4, // One less than max
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithMaxAttempts);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithMaxAttempts,
        failedLoginAttempts: 5,
        lockedUntil: addMinutes(new Date(), 15),
      });

      await service.handleFailedLogin('test@example.com');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          failedLoginAttempts: 5,
          lastLoginAttempt: expect.any(Date),
          lockedUntil: expect.any(Date),
        },
      });
    });

    it('should not fail if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.handleFailedLogin('nonexistent@example.com')
      ).resolves.not.toThrow();
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('should reset failed login attempts', async () => {
      const userWithFailures = {
        ...mockUser,
        failedLoginAttempts: 3,
        lockedUntil: addMinutes(new Date(), 10),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithFailures);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithFailures,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAttempt: new Date(),
      });

      await service.handleSuccessfulLogin('test@example.com');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAttempt: expect.any(Date),
        },
      });
    });
  });

  describe('isAccountLocked', () => {
    it('should return false for non-locked user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(false);
    });

    it('should return true for locked user', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: addMinutes(new Date(), 10),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(true);
    });

    it('should unlock account if lockout period has expired', async () => {
      const expiredLockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() - 10000), // 10 seconds ago
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expiredLockedUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...expiredLockedUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const result = await service.isAccountLocked('test@example.com');

      expect(result).toBe(false);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });

    it('should return false if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.isAccountLocked('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('getLockoutStatus', () => {
    it('should return correct status for active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getLockoutStatus('test@example.com');

      expect(result).toEqual({
        isLocked: false,
        remainingAttempts: 5,
      });
    });

    it('should return correct status for user with failed attempts', async () => {
      const userWithFailures = {
        ...mockUser,
        failedLoginAttempts: 2,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithFailures);

      const result = await service.getLockoutStatus('test@example.com');

      expect(result).toEqual({
        isLocked: false,
        remainingAttempts: 3,
      });
    });

    it('should return correct status for locked user', async () => {
      const lockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: addMinutes(new Date(), 10),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      const result = await service.getLockoutStatus('test@example.com');

      expect(result).toEqual({
        isLocked: true,
        remainingAttempts: 0,
        lockoutExpiresAt: expect.any(Date),
      });
    });

    it('should return default status for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getLockoutStatus('nonexistent@example.com');

      expect(result).toEqual({
        isLocked: false,
        remainingAttempts: 5,
      });
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account and reset failed attempts', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await service.unlockAccount('user-1');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });
  });

  describe('forceLockAccount', () => {
    it('should lock account for specified duration', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        lockedUntil: addMinutes(new Date(), 15),
        lastLoginAttempt: new Date(),
      });

      await service.forceLockAccount('user-1', 'Suspicious activity detected');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          lockedUntil: expect.any(Date),
          lastLoginAttempt: expect.any(Date),
        },
      });
    });
  });

  describe('getMaxFailedAttempts and getLockoutDurationMinutes', () => {
    it('should return correct configuration values', () => {
      expect(service.getMaxFailedAttempts()).toBe(5);
      expect(service.getLockoutDurationMinutes()).toBe(15);
    });
  });
});
