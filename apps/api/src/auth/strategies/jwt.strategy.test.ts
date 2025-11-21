import { Test } from '@nestjs/testing';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from '../../common/database/prisma.service';

describe('JwtStrategy Security', () => {
  let strategy: JwtStrategy;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    // Clear environment variables before each test
    delete process.env.JWT_SECRET;
  });

  describe('JWT Secret Validation', () => {
    it('should throw error when JWT_SECRET is missing', () => {
      expect(() => {
        new JwtStrategy(mockPrismaService);
      }).toThrow(
        'JWT_SECRET environment variable is required. Please set a secure JWT secret (minimum 32 characters).'
      );
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => {
        new JwtStrategy(mockPrismaService);
      }).toThrow(
        'JWT_SECRET must be at least 32 characters long for security. Current length: 5'
      );
    });

    it('should throw error when JWT_SECRET uses placeholder value', () => {
      process.env.JWT_SECRET = 'generate-32-character-random-string-here';

      expect(() => {
        new JwtStrategy(mockPrismaService);
      }).toThrow(
        'JWT_SECRET appears to be using a placeholder or example value. Please generate a secure random secret for production use.'
      );
    });

    it('should throw error when JWT_SECRET uses default_secret', () => {
      process.env.JWT_SECRET = 'default_secret';

      expect(() => {
        new JwtStrategy(mockPrismaService);
      }).toThrow(
        'JWT_SECRET appears to be using a placeholder or example value. Please generate a secure random secret for production use.'
      );
    });

    it('should throw error when JWT_SECRET contains example', () => {
      process.env.JWT_SECRET = 'example-secret-key-for-testing-purposes-only';

      expect(() => {
        new JwtStrategy(mockPrismaService);
      }).toThrow(
        'JWT_SECRET appears to be using a placeholder or example value. Please generate a secure random secret for production use.'
      );
    });

    it('should initialize successfully with valid JWT_SECRET', () => {
      process.env.JWT_SECRET = 'a'.repeat(32); // 32 characters

      expect(() => {
        strategy = new JwtStrategy(mockPrismaService);
      }).not.toThrow();
    });

    it('should initialize successfully with long secure JWT_SECRET', () => {
      process.env.JWT_SECRET =
        'super-secure-jwt-secret-key-that-is-long-enough-for-production-use';

      expect(() => {
        strategy = new JwtStrategy(mockPrismaService);
      }).not.toThrow();
    });
  });

  describe('JWT Payload Validation', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      strategy = new JwtStrategy(mockPrismaService);
    });

    it('should validate user successfully when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const payload = { sub: 'user-123', email: 'test@example.com' };
      const result = await strategy.validate(payload);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const payload = { sub: 'nonexistent-user', email: 'test@example.com' };

      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const payload = { sub: 'user-123', email: 'test@example.com' };

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
