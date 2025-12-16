import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Type definitions for security middleware
interface SecureQueryParams {
  [key: string]: string | string[] | undefined;
}

interface SanitizedQueryParams {
  [key: string]: string | string[] | undefined;
}

/**
 * Security Middleware
 * Adds comprehensive security checks and headers
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');

    // Enhanced security headers
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Comprehensive Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.stripe.com https://js.stripe.com",
        "frame-src 'self' https://js.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; ')
    );

    // Enhanced Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', ')
    );

    // Validate request size
    this.validateRequestSize(req);

    // Validate content type
    this.validateContentType(req);

    // Check for suspicious patterns in request
    this.checkSuspiciousPatterns(req);

    // Sanitize query parameters
    this.sanitizeQueryParams(req);

    // Additional file upload security
    this.validateFileUpload(req);

    next();
  }

  /**
   * Validate request size to prevent DoS attacks
   */
  private validateRequestSize(req: Request): void {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxRequestSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxRequestSize) {
      throw new BadRequestException('Request entity too large');
    }
  }

  /**
   * Validate Content-Type for specific request methods
   */
  private validateContentType(req: Request): void {
    if (
      ['POST', 'PUT', 'PATCH'].includes(req.method) &&
      req.is('application/json') === false &&
      !req.is('multipart/form-data')
    ) {
      // Allow certain endpoints with different content types
      const allowedEndpoints = [
        '/api/webhooks/stripe',
        '/api/webhooks/paypal',
        '/api/auth/magic-link',
      ];

      if (!allowedEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
        throw new BadRequestException('Invalid content type');
      }
    }
  }

  /**
   * Check for suspicious patterns in the request
   */
  private checkSuspiciousPatterns(req: Request): void {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /eval\(/gi,
      /expression\(/gi,
    ];

    const checkString = (str: string): boolean => {
      return suspiciousPatterns.some((pattern) => pattern.test(str));
    };

    // Check URL
    if (checkString(req.url)) {
      throw new BadRequestException('Suspicious pattern detected in URL');
    }

    // Check query parameters
    Object.values(req.query).forEach((value) => {
      if (typeof value === 'string' && checkString(value)) {
        throw new BadRequestException(
          'Suspicious pattern detected in query parameters'
        );
      }
    });

    // Check body (if exists)
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      if (checkString(bodyStr)) {
        throw new BadRequestException(
          'Suspicious pattern detected in request body'
        );
      }
    }
  }

  /**
   * Sanitize query parameters
   */
  private sanitizeQueryParams(req: Request): void {
    if (!req.query) {
      return;
    }

    const sanitizedQuery: SanitizedQueryParams = {};
    const queryKeys = Object.keys(req.query);

    queryKeys.forEach((key) => {
      // Validate key to prevent injection
      const validKeyPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validKeyPattern.test(key)) {
        // Skip invalid keys instead of deleting to avoid mutation
        return;
      }

      const queryValue = req.query[key];
      if (typeof queryValue === 'string') {
        // Remove potentially dangerous characters
        sanitizedQuery[key] = queryValue.replace(/[<>]/g, '').trim();
      } else if (Array.isArray(queryValue)) {
        // Handle array values safely - only keep strings
        const sanitizedArray = queryValue
          .filter((val): val is string => typeof val === 'string')
          .map((val) => val.replace(/[<>]/g, '').trim())
          .filter((val) => val.length > 0);

        if (sanitizedArray.length > 0) {
          sanitizedQuery[key] = sanitizedArray;
        }
      }
      // Skip complex objects (ParsedQs) for security reasons
    });

    // Replace query with sanitized version using type assertion
    req.query = sanitizedQuery as SecureQueryParams;
  }

  /**
   * Additional validation for file uploads
   */
  private validateFileUpload(req: Request): void {
    if (!req.is('multipart/form-data')) {
      return;
    }

    // Validate upload path to prevent directory traversal
    const uploadPath = req.body.path || req.body.folder || '';
    if (uploadPath.includes('..') || uploadPath.includes('~')) {
      throw new BadRequestException('Invalid upload path');
    }
  }
}
