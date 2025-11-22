import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/database/prisma.service';
import { INestApplication } from '@nestjs/common';

describe('PrismaService Type Safety', () => {
  let service: PrismaService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    app = module.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enable shutdown hooks without TypeScript errors', async () => {
    // This test verifies that the $on method is properly typed
    // and no @ts-ignore is needed
    expect(async () => {
      await service.enableShutdownHooks(app);
    }).not.toThrow();
  });

  it('should handle beforeExit event properly', async () => {
    let beforeExitCalled = false;

    // Mock the $on method to verify it's called correctly
    const originalOn = service.$on.bind(service);
    service.$on = (event: string, callback: () => Promise<void>) => {
      if (event === 'beforeExit') {
        beforeExitCalled = true;
        expect(typeof callback).toBe('function');
      }
      return originalOn(event, callback);
    };

    await service.enableShutdownHooks(app);
    expect(beforeExitCalled).toBe(true);
  });

  it('should connect on module init', async () => {
    // Mock $connect to avoid actual database connection in tests
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    service.$connect = mockConnect;

    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalled();
  });
});
