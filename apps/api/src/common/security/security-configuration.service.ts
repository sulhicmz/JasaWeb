import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';
import { EnvironmentUrlValidator } from '../config/environment-url-validator';
import { logger, UrlBuilder, getApiUrl } from '../../../../../packages/config';

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

    const directives = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Temporary for development
        ...(process.env.CSP_SCRIPT_SRC?.split(',') || [
          'https://cdnjs.cloudflare.com',
          'https://www.googletagmanager.com',
        ]),
        ...(isDevelopment ? ['ws://localhost:*'] : []),
      ].filter(Boolean) as string[],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        ...(process.env.CSP_STYLE_SRC?.split(',') || [
          'https://fonts.googleapis.com',
        ]),
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        ...(process.env.CSP_IMG_SRC?.split(',') || [
          'https://*.jasaweb.com',
          'https://res.cloudinary.com',
        ]),
      ],
      connectSrc: [
        "'self'",
        'wss:', // WebSocket connections
        getApiUrl(),
        isDevelopment && 'ws://localhost:*', // Development WebSocket
      ].filter(Boolean) as string[],
      fontSrc: [
        "'self'",
        ...(process.env.CSP_FONT_SRC?.split(',') || [
          'https://fonts.gstatic.com',
        ]),
        'data:',
      ],
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
      const directiveValue = directives[key]; // eslint-disable-line security/detect-object-injection -- Safe access with pre-validated whitelist
      if (directiveValue && Array.isArray(directiveValue)) {
        const filtered = directiveValue.filter(Boolean);
        if (filtered.length > 0) {
          safeDirectives[key] = filtered; // eslint-disable-line security/detect-object-injection -- Safe assignment with validated key
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
      maxAge: Number(process.env.CORS_MAX_AGE) || 24 * 60 * 60, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  // Helper method to get allowed origins based on environment
  private getAllowedOrigins(): string[] {
    try {
      // Use the unified configuration validator for dynamic CORS origins
      const config = EnvironmentUrlValidator.buildEnvironmentUrls();
      return config.corsOrigins;
    } catch {
      // Fallback to manually configured origins with environment awareness
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isProduction = process.env.NODE_ENV === 'production';

      const origins: string[] = process.env.CORS_ALLOWED_ORIGINS?.split(
        ','
      ) || [
        // Production URLs
        'https://jasaweb.com',
        'https://www.jasaweb.com',
        'https://app.jasaweb.com',
      ];

      if (isDevelopment) {
        // Use dynamic origins from UrlBuilder
        origins.push(...UrlBuilder.getAllowedOrigins());
      }

      // Add organization-specific subdomains in production
      if (isProduction) {
        // This would be dynamically generated based on active organizations
        origins.push('https://*.jasaweb.com');
      }

      return origins;
    }
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
      return true;
    } catch (error) {
      logger.error(
        'Security configuration validation failed:',
        error as Error | Record<string, unknown>
      );
      return false;
    }
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
