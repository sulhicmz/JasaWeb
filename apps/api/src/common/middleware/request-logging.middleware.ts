import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestLog {
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  timestamp: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      const log: RequestLog = {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: this.getSafeHeaders(req.headers),
        params: req.params,
        query: req.query as Record<string, string>,
        body: this.shouldLogBody(req) ? req.body : undefined,
        statusCode: res.statusCode,
        responseTime,
        ip: this.getClientIP(req),
        userAgent: req.get('User-Agent') || '',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(JSON.stringify(log));
    });

    next();
  }

  private getSafeHeaders(headers: Request['headers']): Record<string, string> {
    const safeHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      // Don't log sensitive headers
      if (
        !['authorization', 'cookie', 'x-api-key', 'x-auth-token'].includes(
          key.toLowerCase()
        )
      ) {
        if (Array.isArray(value)) {
          safeHeaders[key] = value.join(', ');
        } else if (typeof value === 'string') {
          safeHeaders[key] = value;
        }
      } else {
        safeHeaders[key] = '[REDACTED]';
      }
    }
    return safeHeaders;
  }

  private shouldLogBody(req: Request): boolean {
    // Don't log body for file uploads or very large payloads
    const contentLength = req.get('Content-Length');
    const contentType = req.get('Content-Type');

    if (contentLength && parseInt(contentLength, 10) > 1000000) {
      // 1MB
      return false;
    }

    if (
      contentType &&
      (contentType.includes('multipart/form-data') ||
        contentType.includes('application/octet-stream'))
    ) {
      return false;
    }

    return true;
  }

  private getClientIP(req: Request): string {
    // Try multiple headers to get the real client IP
    const forwardedFor = req.headers['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] ?? '';
    }

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      const [first] = forwardedFor.split(',');
      return first?.trim() ?? '';
    }

    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.length > 0) {
      return realIp;
    }

    return (
      req.socket?.remoteAddress ||
      (req.connection as any)?.remoteAddress ||
      req.ip ||
      ''
    );
  }
}
