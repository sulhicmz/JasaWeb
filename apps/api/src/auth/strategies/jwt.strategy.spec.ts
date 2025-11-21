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

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    // Store original env
    const originalEnv = process.env.JWT_SECRET;

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

    // Restore env after each test
    process.env.JWT_SECRET = originalEnv;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        new JwtStrategy(mockPrismaService as any);
      }).toThrow('JWT_SECRET environment variable is required for security');
    });

    it('should log warning when using default example secret', () => {
      process.env.JWT_SECRET =
        'your-super-secret-jwt-key-change-this-in-production';

      const loggerSpy = jest
        .spyOn(strategy['logger'], 'warn')
        .mockImplementation();

      new JwtStrategy(mockPrismaService as any);

      expect(loggerSpy).toHaveBeenCalledWith(
        'JWT_SECRET is using the default example value. Please change it to a secure, unique secret in production.'
      );

      loggerSpy.mockRestore();
    });

    it('should initialize successfully with valid JWT_SECRET', () => {
      process.env.JWT_SECRET =
        'a-very-secure-random-secret-key-that-is-long-enough';

      expect(() => {
        new JwtStrategy(mockPrismaService as any);
      }).not.toThrow();
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      // Set valid JWT secret for validation tests
      process.env.JWT_SECRET =
        'a-very-secure-random-secret-key-that-is-long-enough';
      strategy = new JwtStrategy(mockPrismaService as any);
    });

    it('should return user without password when valid payload is provided', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user is not found', async () => {
      const payload = { sub: '999', email: 'nonexistent@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle database errors gracefully', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
