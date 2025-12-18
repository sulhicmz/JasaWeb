import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';
import { logger } from '../../../../../packages/config/logger';

export interface SecurityPolicyConfig {
  csp: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  cors: {
    origin: string | string[];
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  };
}

@Injectable()
export class SecurityConfigurationService {
  constructor(private readonly appConfig: AppConfigService) {}

  // Enhanced CSP configuration with multi-tenant safety
  getCspConfig(): SecurityPolicyConfig['csp'] {
    const isDevelopment = this.appConfig.isDevelopment();
    const allowedOrigins = this.getAllowedOrigins();

    const directives = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Temporary for development
        'https://cdnjs.cloudflare.com',
        'https://www.googletagmanager.com',
        ...(isDevelopment ? ['ws://localhost:*'] : []),
      ].filter(Boolean) as string[],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.jasaweb.com',
        'https://res.cloudinary.com',
      ],
      connectSrc: [
        "'self'",
        'wss:', // WebSocket connections
        'https://api.jasaweb.com',
        isDevelopment && 'ws://localhost:*', // Development WebSocket
      ].filter(Boolean) as string[],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      ...(this.appConfig.isProduction() && { upgradeInsecureRequests: [] }),
    };

    // Create a new object to safely handle directives without prototype pollution
    const safeDirectives = Object.create(null);
    const validDirectiveKeys = [
      'defaultSrc',
      'scriptSrc',
      'styleSrc',
      'imgSrc',
      'connectSrc',
      'fontSrc',
      'objectSrc',
      'mediaSrc',
      'frameSrc',
      'childSrc',
      'workerSrc',
      'manifestSrc',
      'upgradeInsecureRequests',
    ] as const;

    for (const key of validDirectiveKeys) {
      if (Object.prototype.hasOwnProperty.call(directives, key)) {
        const directiveValue = directives[key];
        if (directiveValue && Array.isArray(directiveValue)) {
          const filtered = directiveValue.filter(Boolean);
          if (filtered.length > 0) {
            Object.defineProperty(safeDirectives, key, {
              value: filtered,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
      }
    }

    return {
      directives: safeDirectives,
      reportOnly: isDevelopment, // Use report-only in development
    };
  }

  // Enhanced rate limiting configuration
  getRateLimitConfig(): SecurityPolicyConfig['rateLimit'] {
    const isProduction = this.appConfig.isProduction();

    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // Stricter in production
      message: JSON.stringify({
        error: 'Too many requests',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
      }),
      standardHeaders: true,
      legacyHeaders: false,
    };
  }

  // CORS configuration with multi-tenant support
  getCorsConfig(): SecurityPolicyConfig['cors'] {
    const allowedOrigins = this.getAllowedOrigins();
    const isDevelopment = this.appConfig.isDevelopment();

    return {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-tenant-id',
        'x-organization-id',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
      credentials: true,
      maxAge: 24 * 60 * 60, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  // Helper method to get allowed origins based on environment
  private getAllowedOrigins(): string[] {
    const isDevelopment = this.appConfig.isDevelopment();
    const isProduction = this.appConfig.isProduction();

    const origins: string[] = [
      'http://localhost:3000',
      'http://localhost:4321', // Astro default port
      'https://jasaweb.com',
      'https://www.jasaweb.com',
      'https://app.jasaweb.com',
    ];

    if (isDevelopment) {
      origins.push(
        'http://localhost:8080',
        'http://localhost:3001',
        'http://localhost:3333'
      );
    }

    // Add organization-specific subdomains in production
    if (isProduction) {
      // This would be dynamically generated based on active organizations
      origins.push('https://*.jasaweb.com');
    }

    return origins;
  }

  // Security headers configuration
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.getPermissionsPolicy(),
      'Strict-Transport-Security': this.getHSTSHeader(),
    };
  }

  private getPermissionsPolicy(): string {
    return [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ');
  }

  private getHSTSHeader(): string {
    const isProduction = this.appConfig.isProduction();
    if (isProduction) {
      return 'max-age=31536000; includeSubDomains; preload';
    }
    return 'max-age=0'; // Disabled in development
  }

  // Validate and sanitize security configurations
  validateSecurityConfig(config: Partial<SecurityPolicyConfig>): boolean {
    try {
      if (config.csp?.directives) {
        // Validate CSP directives structure
        for (const [key, value] of Object.entries(config.csp.directives)) {
          if (!Array.isArray(value)) {
            logger.error(`Invalid CSP directive structure for ${key}`);
            return false;
          }
        }
      }

      // Validate CORS origins
      if (config.cors?.origin) {
        const origins = Array.isArray(config.cors.origin)
          ? config.cors.origin
          : [config.cors.origin];

        for (const origin of origins) {
          if (
            typeof origin !== 'string' ||
            !origin.match(/^https?:\/\/[\w.-]+/)
          ) {
            logger.error(`Invalid CORS origin: ${origin}`);
            return false;
          }
        }
      }

      return true;
<<<<<<< HEAD
    }

    const isAllowed = allowedOrigins.includes(origin);

    if (!isAllowed) {
      logger.security('Unauthorized CORS attempt', { origin, allowedOrigins });
    }

    return isAllowed;
  }

  // Method to log security events
  logSecurityEvent(event: string, details: Record<string, unknown>): void {
    logger.security(event, details);

    // In production, this could send to a SIEM or security monitoring service
    if (this.appConfig.isProduction()) {
      // TODO: Integrate with security monitoring service
      // Example: Send to Sentry, Datadog, or custom security endpoint
=======
    } catch (error) {
      logger.error('Security configuration validation failed:', error);
      return false;
>>>>>>> origin/main
    }
  }

  // Get organization-specific security context
  getOrganizationSecurityContext(organizationId: string) {
    const baseConfig = {
      csp: this.getCspConfig(),
      cors: this.getCorsConfig(),
      rateLimit: this.getRateLimitConfig(),
    };

    // Customize based on organization tier/requirements
    // This would integrate with your organization management system
    const organizationOverrides =
      this.getOrganizationSecurityOverrides(organizationId);

    return {
      ...baseConfig,
      ...organizationOverrides,
    };
  }

  private getOrganizationSecurityOverrides(organizationId: string) {
    // Example: Different security policies for different organization tiers
    const enhancedOrgs = ['premium-org-1', 'enterprise-org-2'];

    if (enhancedOrgs.includes(organizationId)) {
      return {
        rateLimit: {
          ...this.getRateLimitConfig(),
          max: 500, // Higher rate limit for premium organizations
        },
      };
    }

    return {};
  }
}
