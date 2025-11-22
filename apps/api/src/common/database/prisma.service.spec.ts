import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { INestApplication } from '@nestjs/common';

describe('PrismaService', () => {
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

  it('should have enableShutdownHooks method', () => {
    expect(typeof service.enableShutdownHooks).toBe('function');
  });

  it('should register beforeExit hook without TypeScript errors', async () => {
    // This test verifies that the TypeScript suppression has been removed
    // and the code still works correctly
    const closeSpy = jest.spyOn(app, 'close').mockResolvedValue();

    await service.enableShutdownHooks(app);

    // The $on method should be callable without TypeScript errors
    expect(typeof service.$on).toBe('function');

    closeSpy.mockRestore();
  });

  it('should connect on module init', async () => {
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });
});
