import { Test } from '@nestjs/testing';
import { ConfigValidationService } from './config-validation.service';

describe('ConfigValidationService', () => {
  let service: ConfigValidationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigValidationService],
    }).compile();

    service = module.get<ConfigValidationService>(ConfigValidationService);
  });

  describe('onModuleInit', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      process.env.DATABASE_URL = 'postgresql://localhost/test';

      await expect(service.onModuleInit()).rejects.toThrow(
        'Missing required environment variables: JWT_SECRET'
      );
    });

    it('should throw error when JWT_SECRET is too short', async () => {
      process.env.JWT_SECRET = 'short';
      process.env.DATABASE_URL = 'postgresql://localhost/test';

      await expect(service.onModuleInit()).rejects.toThrow(
        'Invalid environment variables: JWT_SECRET (minimum 32 characters required)'
      );
    });

    it('should throw error when DATABASE_URL is missing', async () => {
      process.env.JWT_SECRET =
        'this-is-a-valid-secret-that-is-long-enough-for-testing';
      delete process.env.DATABASE_URL;

      await expect(service.onModuleInit()).rejects.toThrow(
        'Missing required environment variables: DATABASE_URL'
      );
    });

    it('should throw error when multiple variables are missing', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;

      await expect(service.onModuleInit()).rejects.toThrow(
        'Missing required environment variables: JWT_SECRET, DATABASE_URL'
      );
    });

    it('should pass validation with valid environment variables', async () => {
      process.env.JWT_SECRET =
        'this-is-a-valid-secret-that-is-long-enough-for-testing';
      process.env.DATABASE_URL = 'postgresql://localhost/test';

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });
});
