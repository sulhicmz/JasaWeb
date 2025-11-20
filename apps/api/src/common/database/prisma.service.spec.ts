import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have proper methods', () => {
    expect(service.onModuleInit).toBeDefined();
    expect(service.enableShutdownHooks).toBeDefined();
    expect(service.onModuleDestroy).toBeDefined();
  });

  describe('enableShutdownHooks', () => {
    it('should register beforeExit event handler', async () => {
      const mockApp = {
        close: jest.fn().mockResolvedValue(undefined),
      } as any;

      // Mock the $on method
      const mockOn = jest.fn().mockImplementation((event, callback) => {
        if (event === 'beforeExit') {
          callback();
        }
      });
      service.$on = mockOn;

      await service.enableShutdownHooks(mockApp);

      expect(mockOn).toHaveBeenCalledWith('beforeExit', expect.any(Function));
      expect(mockApp.close).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      const mockDisconnect = jest.fn().mockResolvedValue(undefined);
      service.$disconnect = mockDisconnect;

      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
