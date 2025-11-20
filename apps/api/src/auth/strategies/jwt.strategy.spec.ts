import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../common/database/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const originalEnv = process.env.JWT_SECRET;

    process.env.JWT_SECRET = 'test_jwt_secret_that_is_long_enough_for_security';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);

    process.env.JWT_SECRET = originalEnv;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        new JwtStrategy(mockPrismaService as any);
      }).toThrow('JWT_SECRET environment variable is required');
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => {
        new JwtStrategy(mockPrismaService as any);
      }).toThrow('JWT_SECRET must be at least 32 characters long');
    });

    it('should initialize successfully with valid JWT_SECRET', () => {
      process.env.JWT_SECRET =
        'valid_jwt_secret_that_is_long_enough_for_security';

      expect(() => {
        new JwtStrategy(mockPrismaService as any);
      }).not.toThrow();
    });
  });

  describe('validate', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user without password when user exists', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user does not exist', async () => {
      const payload = { sub: 'non-existent-user', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle database errors gracefully', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
