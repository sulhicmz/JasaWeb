import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService Security', () => {
  let service: PrismaService;
  let mockApp: jest.Mocked<INestApplication>;

  beforeEach(async () => {
    mockApp = {
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  describe('Database Connection', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
    });

    it('should handle connection errors gracefully', async () => {
      // Mock $connect to throw an error
      const originalConnect = service.$connect;
      service.$connect = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');

      // Restore original method
      service.$connect = originalConnect;
    });
  });

  describe('Shutdown Hooks', () => {
    it('should register shutdown hooks correctly', async () => {
      // This should not throw any errors
      expect(() => {
        service.enableShutdownHooks(mockApp);
      }).not.toThrow();
    });

    it('should handle shutdown errors gracefully', async () => {
      mockApp.close.mockRejectedValue(new Error('Shutdown failed'));

      // Register the hook
      service.enableShutdownHooks(mockApp);

      // The error should be logged but not thrown during registration
      expect(() => {
        service.enableShutdownHooks(mockApp);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect successfully', async () => {
      // Mock $disconnect to resolve successfully
      const originalDisconnect = service.$disconnect;
      service.$disconnect = jest.fn().mockResolvedValue(undefined);

      await expect(service.onModuleDestroy()).resolves.not.toThrow();

      // Restore original method
      service.$disconnect = originalDisconnect;
    });

    it('should handle disconnection errors gracefully', async () => {
      // Mock $disconnect to throw an error
      const originalDisconnect = service.$disconnect;
      service.$disconnect = jest
        .fn()
        .mockRejectedValue(new Error('Disconnection failed'));

      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnection failed'
      );

      // Restore original method
      service.$disconnect = originalDisconnect;
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain proper TypeScript typing without @ts-ignore', () => {
      // This test verifies that the service can be used without TypeScript suppression
      expect(typeof service.$connect).toBe('function');
      expect(typeof service.$disconnect).toBe('function');
      expect(typeof service.$on).toBe('function');
      expect(typeof service.enableShutdownHooks).toBe('function');
    });

    it('should properly type the beforeExit event handler', () => {
      // Verify that the event handler is properly typed
      const mockCallback = jest.fn();

      expect(() => {
        service.$on('beforeExit', mockCallback);
      }).not.toThrow();
    });
  });
});
