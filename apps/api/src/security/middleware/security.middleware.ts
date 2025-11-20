import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityMonitoringService } from '../security/monitoring/security-monitoring.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(private securityService: SecurityMonitoringService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response
    res.end = function (chunk?: any, encoding?: any) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Log security event for suspicious patterns
      this.logSecurityEvent(req, res, ipAddress, userAgent, responseTime);
    }.bind(this);

    next();
  }

  private async logSecurityEvent(
    req: Request,
    res: Response,
    ipAddress: string,
    userAgent: string,
    responseTime: number
  ) {
    try {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(
        req,
        res,
        ipAddress,
        userAgent,
        responseTime,
        userId,
        organizationId
      );

      // Log data access events
      if (this.isDataAccessEndpoint(req.path) && res.statusCode === 200) {
        await this.securityService.recordSecurityEvent({
          type: 'data_access',
          userId,
          organizationId,
          ipAddress,
          userAgent,
          success: true,
          details: {
            endpoint: req.path,
            method: req.method,
            responseTime,
          },
          riskScore: this.calculateDataAccessRisk(req.path, responseTime),
        });
      }
    } catch (error) {
      this.logger.error('Failed to log security event', error.stack);
    }
  }

  private async checkSuspiciousPatterns(
    req: Request,
    res: Response,
    ipAddress: string,
    userAgent: string,
    responseTime: number,
    userId?: string,
    organizationId?: string
  ) {
    // Check for rapid requests (potential DoS)
    if (responseTime > 5000) {
      // Slow response might indicate attack
      await this.securityService.recordSecurityEvent({
        type: 'suspicious_activity',
        userId,
        organizationId,
        ipAddress,
        userAgent,
        success: res.statusCode < 400,
        details: {
          reason: 'slow_response',
          responseTime,
          endpoint: req.path,
        },
        riskScore: 30,
      });
    }

    // Check for authentication failures
    if (req.path.includes('/auth') && res.statusCode === 401) {
      await this.securityService.recordSecurityEvent({
        type: 'login_attempt',
        userId,
        organizationId,
        ipAddress,
        userAgent,
        success: false,
        details: {
          endpoint: req.path,
          method: req.method,
        },
        riskScore: 40,
      });
    }

    // Check for unusual user agents
    if (this.isSuspiciousUserAgent(userAgent)) {
      await this.securityService.recordSecurityEvent({
        type: 'suspicious_activity',
        userId,
        organizationId,
        ipAddress,
        userAgent,
        success: res.statusCode < 400,
        details: {
          reason: 'suspicious_user_agent',
          endpoint: req.path,
        },
        riskScore: 25,
      });
    }
  }

  private getClientIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private isDataAccessEndpoint(path: string): boolean {
    const dataAccessPatterns = [
      '/api/users',
      '/api/projects',
      '/api/files',
      '/api/invoices',
      '/api/tickets',
      '/api/approvals',
    ];

    return dataAccessPatterns.some((pattern) => path.startsWith(pattern));
  }

  private calculateDataAccessRisk(path: string, responseTime: number): number {
    let riskScore = 10; // Base risk

    // Higher risk for sensitive endpoints
    if (path.includes('/users') || path.includes('/invoices')) {
      riskScore += 15;
    }

    // Higher risk for large data downloads (inferred from response time)
    if (responseTime > 2000) {
      riskScore += 10;
    }

    return Math.min(riskScore, 50);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /java/i,
      /sqlmap/i,
      /nmap/i,
      /metasploit/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }
}
