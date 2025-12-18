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

  // Enhanced Content Security Policy configuration
  getCSPConfig(): SecurityPolicyConfig['csp'] {
    const isProduction = this.appConfig.isProduction();
    const isDevelopment = this.appConfig.isDevelopment();

    const directives: Record<string, string[]> = {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS and other frameworks
        'https://fonts.googleapis.com',
      ],
      scriptSrc: [
        "'self'",
        isDevelopment && "'unsafe-eval'", // Allow eval in development for Vite/HMR
      ].filter(Boolean) as string[],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'https://*.googleapis.com',
        'https://*.gstatic.com',
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
      ...(isProduction && { upgradeInsecureRequests: [] }),
    };

    // Filter out undefined values using safe Object.keys iteration
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

    // Create a new object to safely handle directives without prototype pollution
    const safeDirectives = Object.create(null);

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

<<<<<<< HEAD
    // Security: Use safe object creation with validated keys
    const filteredDirectives: Record<string, string[]> = {};
    const validKeys = new Set([
      'defaultSrc',
      'scriptSrc',
      'styleSrc',
      'imgSrc',
      'fontSrc',
      'connectSrc',
      'mediaSrc',
      'objectSrc',
      'childSrc',
      'frameSrc',
      'workerSrc',
      'manifestSrc',
      'upgradeInsecureRequests',
    ]);

    for (const [key, value] of directiveEntries) {
      if (validKeys.has(key) && Array.isArray(value)) {
        const filtered = value.filter(Boolean);
        if (filtered.length > 0) {
          Object.defineProperty(filteredDirectives, key, {
            value: filtered,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
    }

    // Security: Safely clear and repopulate directives object
    const directiveKeys = Object.keys(directives);
    for (const key of directiveKeys) {
      delete directives[key as keyof typeof directives];
    }

    // Explicit assignment of filtered directives
    for (const [key, value] of Object.entries(filteredDirectives)) {
      if (key in directives) {
        directives[key as keyof typeof directives] = value;
      }
    }

=======
>>>>>>> 946a7a49b31f0dbd2631030128cac0a50ca324d6
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

  // Enhanced CORS configuration
  getCORSConfig(): SecurityPolicyConfig['cors'] {
    const origins = this.appConfig.getCorsOrigins;
    const isProduction = this.appConfig.isProduction();

    return {
      origin: origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant-ID',
        'X-Organization-ID',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
      ],
      credentials: true,
      maxAge: isProduction ? 86400 : 3600, // 24h in production, 1h in development
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  // Additional security headers configuration
  getAdditionalSecurityHeaders(): Record<string, string> {
    const isProduction = this.appConfig.isProduction();

    return {
      'Permissions-Policy':
        'geolocation=(), microphone=(), camera=(), usb=(), payment=(), fullscreen=(self)',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': isProduction
        ? 'require-corp'
        : 'unsafe-none',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': isProduction
        ? 'max-age=31536000; includeSubDomains; preload'
        : 'max-age=0',
    };
  }

  // Method to validate incoming requests
  validateRequestOrigin(origin: string): boolean {
    const allowedOrigins = this.appConfig.getCorsOrigins;

    if (allowedOrigins.includes('*')) {
      logger.security(
        'Wildcard CORS origin detected - consider limiting in production'
      );
      return true;
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
      // Security monitoring service integration to be implemented
      // Example: Send to Sentry, Datadog, or custom security endpoint
    }
  }

  // Get complete security configuration
  getCompleteSecurityConfig(): SecurityPolicyConfig & {
    additionalHeaders: Record<string, string>;
  } {
    return {
      csp: this.getCSPConfig(),
      rateLimit: this.getRateLimitConfig(),
      cors: this.getCORSConfig(),
      additionalHeaders: this.getAdditionalSecurityHeaders(),
    };
  }
}
