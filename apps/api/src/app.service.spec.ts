import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return welcome message', () => {
      expect(service.getHello()).toBe('Welcome to JasaWeb API!');
    });
  });

  describe('getHealth', () => {
    it('should return health status with timestamp', () => {
      const health = service.getHealth();
      expect(health).toHaveProperty('status', 'OK');
      expect(health).toHaveProperty('timestamp');
      expect(typeof health.timestamp).toBe('string');
      expect(new Date(health.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
