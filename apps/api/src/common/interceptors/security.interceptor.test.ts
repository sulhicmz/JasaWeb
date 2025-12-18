import { Test, TestingModule } from '@nestjs/testing';
import { SecurityInterceptor } from './security.interceptor';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { logger } from '../../../../../packages/config/logger';
import { vi } from 'vitest';

// Mock the logger
vi.mock('../../../../../packages/config/logger');
const mockLogger = logger as any;

describe('SecurityInterceptor', () => {
  let interceptor: SecurityInterceptor;
  let reflector: any;

  beforeEach(async () => {
    const mockReflector = {
      get: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityInterceptor,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<SecurityInterceptor>(SecurityInterceptor);
    reflector = module.get<Reflector>(Reflector);

    // Reset logger mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        url: '/api/test',
        get: vi.fn(),
        user: { id: 'user123', organizationId: 'org123' },
      };

      mockResponse = {
        setHeader: vi.fn(),
        statusCode: 200,
      };

      mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as any;

      mockCallHandler = {
        handle: vi.fn().mockReturnValue(of({ data: 'test' })),
      };

      reflector.get.mockReturnValue({});
    });

    it('should add request ID to response headers', () => {
      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.stringMatching(/^req_\d+_[a-z0-9]+$/)
      );
    });

    it('should log audit events for operations with auditLog metadata', () => {
      const metadata = { auditLog: true };
      reflector.get.mockReturnValue(metadata);

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Request started: GET /api/test',
        'user123',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          userId: 'user123',
          organizationId: 'org123',
        })
      );
    });

    it('should log sensitive operations', () => {
      const metadata = { auditLog: true, sensitive: true };
      reflector.get.mockReturnValue(metadata);

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Sensitive operation: GET /api/test',
        'user123',
        expect.any(Object)
      );
    });

    it('should handle security errors appropriately', () => {
      const securityError = new Error('Security violation');
      mockCallHandler.handle.mockReturnValue(throwError(() => securityError));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(securityError);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Security error',
            expect.objectContaining({
              error: securityError.message,
              method: 'GET',
              url: '/api/test',
            })
          );
        },
      });
    });

    it('should handle non-security errors with regular error logging', () => {
      const regularError = new Error('Regular error');
      mockCallHandler.handle.mockReturnValue(throwError(() => regularError));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(regularError);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
              error: regularError.message,
              method: 'GET',
              url: '/api/test',
            })
          );
        },
      });
    });

    it('should extract client IP correctly', () => {
      mockRequest.get = vi.fn().mockReturnValue('192.168.1.1');

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockRequest.get).toHaveBeenCalledWith('X-Forwarded-For');
    });

    it('should handle request completion logging', () => {
      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Request completed: GET /api/test',
        'user123',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
        })
      );
    });
  });
});
