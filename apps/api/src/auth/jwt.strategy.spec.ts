import { Test } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from '../../common/database/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;

      expect(() => new JwtStrategy(prismaService)).toThrow(
        'JWT_SECRET environment variable is required for authentication'
      );
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => new JwtStrategy(prismaService)).toThrow(
        'JWT_SECRET must be at least 32 characters long for security'
      );
    });

    it('should initialize successfully with valid JWT_SECRET', () => {
      process.env.JWT_SECRET =
        'this-is-a-valid-secret-that-is-long-enough-for-testing';

      expect(() => new JwtStrategy(prismaService)).not.toThrow();
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      process.env.JWT_SECRET =
        'this-is-a-valid-secret-that-is-long-enough-for-testing';
      strategy = new JwtStrategy(prismaService);
    });

    it('should return user without password when user exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      const result = await strategy.validate({ sub: '1' });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(strategy.validate({ sub: '1' })).rejects.toThrow(
        'User not found'
      );
    });
  });
});
