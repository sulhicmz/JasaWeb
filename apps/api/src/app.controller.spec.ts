import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHello: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      mockAppService.getHello.mockReturnValue('Hello World!');

      expect(appController.getHello()).toBe('Hello World!');
      expect(mockAppService.getHello).toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      mockAppService.getHealth.mockReturnValue(healthResponse);

      expect(appController.getHealth()).toEqual(healthResponse);
      expect(mockAppService.getHealth).toHaveBeenCalled();
    });
  });
});
