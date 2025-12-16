import { Test, TestingModule } from '@nestjs/testing';
import { SecurityInterceptor } from './security.interceptor';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { logger } from '../../../../../packages/config/logger';

// Mock the logger
jest.mock('../../../../../packages/config/logger');
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('SecurityInterceptor', () => {
  let interceptor: SecurityInterceptor;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
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
    reflector = module.get<Reflector>(Reflector) as jest.Mocked<Reflector>;

    // Reset logger mocks
    jest.clearAllMocks();
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
        get: jest.fn(),
        user: { id: 'user123', organizationId: 'org123' },
      };

      mockResponse = {
        setHeader: jest.fn(),
        statusCode: 200,
      };

      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as any;

      mockCallHandler = {
        handle: jest.fn(),
      };

      reflector.get.mockReturnValue({});
    });

    it('should add request ID to response headers', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.stringMatching(/^req_\d+_[a-z0-9]+$/)
      );
    });

    it('should log audit events for operations with auditLog metadata', () => {
      const metadata = { auditLog: true };
      reflector.get.mockReturnValue(metadata);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Request started: GET /api/test',
        'user123',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          userId: 'user123',
          sensitive: false,
        })
      );
    });

    it('should log sensitive operations', () => {
      const metadata = { sensitiveOperation: true };
      reflector.get.mockReturnValue(metadata);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Request started: GET /api/test',
        'user123',
        expect.objectContaining({
          sensitive: true,
        })
      );
    });

    it('should handle security errors appropriately', () => {
      reflector.get.mockReturnValue({ auditLog: true });

      const error = {
        constructor: { name: 'UnauthorizedError' },
        message: 'Unauthorized',
        status: 401,
      };

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockLogger.security).toHaveBeenCalledWith(
            'Security error occurred',
            expect.objectContaining({
              error: 'Unauthorized',
              statusCode: 401,
              errorType: 'UnauthorizedError',
            })
          );
        },
      });
    });

    it('should handle non-security errors with regular error logging', () => {
      const error = {
        constructor: { name: 'RegularError' },
        message: 'Something went wrong',
        status: 500,
      };

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Request error occurred',
            error
          );
        },
      });
    });

    it('should extract client IP correctly', () => {
      mockRequest.get.mockImplementation((header: string) => {
        const headers = {
          'X-Forwarded-For': '192.168.1.1,10.0.0.1',
          'X-Real-IP': '192.168.1.2',
          'User-Agent': 'test-agent',
          Origin: 'https://example.com',
          Referer: 'https://example.com/page',
        };
        return headers[header as keyof typeof headers];
      });

      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      reflector.get.mockReturnValue({ auditLog: true });

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          ip: '192.168.1.1', // Should use X-Forwarded-For first
          userAgent: 'test-agent',
          origin: 'https://example.com',
          referer: 'https://example.com/page',
        })
      );
    });

    it('should handle request completion logging', () => {
      reflector.get.mockReturnValue({ auditLog: true });
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockContext, mockCallHandler).subscribe();

      expect(mockLogger.audit).toHaveBeenCalledWith(
        'Request completed: GET /api/test',
        'user123',
        expect.objectContaining({
          duration: expect.any(Number),
          statusCode: 200,
          success: true,
        })
      );
    });
  });
});
