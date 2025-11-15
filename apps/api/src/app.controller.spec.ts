import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockAppService = {
    getHello: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHello', () => {
    it('should return welcome message', () => {
      const expectedMessage = 'Welcome to JasaWeb API!';
      mockAppService.getHello.mockReturnValue(expectedMessage);

      const result = appController.getHello();

      expect(appService.getHello).toHaveBeenCalled();
      expect(result).toBe(expectedMessage);
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const expectedHealth = {
        status: 'OK',
        timestamp: new Date().toISOString(),
      };
      mockAppService.getHealth.mockReturnValue(expectedHealth);

      const result = appController.getHealth();

      expect(appService.getHealth).toHaveBeenCalled();
      expect(result).toEqual(expectedHealth);
      expect(result.status).toBe('OK');
      expect(result.timestamp).toBeDefined();
    });
  });
});
