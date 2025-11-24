import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware
 * Adds additional security checks and headers
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');

    // Add security headers (additional to Helmet)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Prevent clickjacking
    res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'');

    // Check for suspicious patterns in request
    this.checkSuspiciousPatterns(req);

    // Sanitize query parameters
    this.sanitizeQueryParams(req);

    next();
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
      return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    // Check URL
    if (checkString(req.url)) {
      throw new Error('Suspicious pattern detected in URL');
    }

    // Check query parameters
    Object.values(req.query).forEach(value => {
      if (typeof value === 'string' && checkString(value)) {
        throw new Error('Suspicious pattern detected in query parameters');
      }
    });

    // Check body (if exists)
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      if (checkString(bodyStr)) {
        throw new Error('Suspicious pattern detected in request body');
      }
    }
  }

  /**
   * Sanitize query parameters
   */
  private sanitizeQueryParams(req: Request): void {
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];
        if (typeof value === 'string') {
          // Remove potentially dangerous characters
          req.query[key] = value
            .replace(/[<>]/g, '')
            .trim();
        }
      });
    }
  }
}
