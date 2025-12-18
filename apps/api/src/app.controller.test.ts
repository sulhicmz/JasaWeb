import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import 'reflect-metadata';

// Mock AppService
const mockAppService = {
  getHello: vi.fn().mockReturnValue('Hello World!'),
  getHealth: vi.fn().mockReturnValue({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
};

describe('AppController', () => {
  let appController: AppController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHello', () => {
    it('should return greeting message', () => {
      const expectedMessage = 'Hello from JasaWeb API!';
      mockAppService.getHello.mockReturnValue(expectedMessage);

      const result = appController.getHello();

      expect(result).toBe(expectedMessage);
      expect(mockAppService.getHello).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const expectedHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      mockAppService.getHealth.mockReturnValue(expectedHealth);

      const result = appController.getHealth();

      expect(result).toEqual(expectedHealth);
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
