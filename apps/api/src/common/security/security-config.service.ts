import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentUrlValidator } from '../config/environment-url-validator';
import { UrlBuilder } from '@jasaweb/config';

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    authEndpoints: {
      windowMs: number;
      max: number;
    };
  };
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
  multiTenant: {
    membershipHeaderName: string;
    requireMembershipValidation: boolean;
  };
  environment: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

@Injectable()
export class SecurityConfigService {
  private readonly config: SecurityConfig;

  constructor(private readonly configService: ConfigService) {
    this.validateSecurityEnvironment();
    this.config = this.buildSecurityConfig();
  }

  private validateSecurityEnvironment(): void {
    const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'];

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.configService.get(varName)
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required security environment variables: ${missingVars.join(', ')}`
      );
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security'
      );
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
      throw new Error(
        `NODE_ENV must be one of: development, production, test. Got: ${nodeEnv}`
      );
    }
  }

  private buildSecurityConfig(): SecurityConfig {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';

    return {
      jwt: {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'jasaweb-api'),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'jasaweb-client'
        ),
      },
      cors: {
        allowedOrigins: this.buildAllowedOrigins(isDevelopment),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-Tenant-ID',
          this.configService.get<string>(
            'MULTI_TENANT_MEMBERSHIP_HEADER',
            'membership-id'
          ),
        ],
        credentials: true,
      },
      rateLimit: {
        windowMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_WINDOW_MS', '60000'),
          10
        ),
        max: parseInt(
          this.configService.get<string>('RATE_LIMIT_MAX', '100'),
          10
        ),
        authEndpoints: {
          windowMs: parseInt(
            this.configService.get<string>(
              'AUTH_RATE_LIMIT_WINDOW_MS',
              '900000'
            ),
            10
          ), // 15 minutes
          max: parseInt(
            this.configService.get<string>('AUTH_RATE_LIMIT_MAX', '5'),
            10
          ),
        },
      },
      headers: {
        contentSecurityPolicy: this.buildCSP(isDevelopment),
        strictTransportSecurity: isProduction
          ? 'max-age=31536000; includeSubDomains; preload'
          : 'max-age=0',
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
      },
      multiTenant: {
        membershipHeaderName: this.configService.get<string>(
          'MULTI_TENANT_MEMBERSHIP_HEADER',
          'membership-id'
        ),
        requireMembershipValidation: this.configService.get<boolean>(
          'MULTI_TENANT_REQUIRE_MEMBERSHIP_VALIDATION',
          true
        ),
      },
      environment: nodeEnv,
      isProduction,
      isDevelopment,
    };
  }

  private buildAllowedOrigins(isDevelopment: boolean): string[] {
    try {
      // Use the unified configuration validator for dynamic CORS origins
      const config = EnvironmentUrlValidator.buildEnvironmentUrls();
      return config.corsOrigins;
    } catch {
      // Fallback to manually configured origins with environment awareness
      if (isDevelopment) {
        return UrlBuilder.getAllowedOrigins();
      }

      const productionOrigins =
        this.configService.get<string>('ALLOWED_ORIGINS');
      if (productionOrigins) {
        return productionOrigins
          .split(',')
          .map((origin: string) => origin.trim());
      }

      return [];
    }
  }

  private buildCSP(isDevelopment: boolean): string {
    const baseDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    if (isDevelopment) {
      baseDirectives.push("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    }

    return baseDirectives.join('; ');
  }

  getConfig(): SecurityConfig {
    return this.config;
  }

  getJwtConfig(): SecurityConfig['jwt'] {
    return this.config.jwt;
  }

  getCorsConfig(): SecurityConfig['cors'] {
    return this.config.cors;
  }

  getRateLimitConfig(): SecurityConfig['rateLimit'] {
    return this.config.rateLimit;
  }

  getHeadersConfig(): SecurityConfig['headers'] {
    return this.config.headers;
  }

  getMultiTenantConfig(): SecurityConfig['multiTenant'] {
    return this.config.multiTenant;
  }

  isSecureEnvironment(): boolean {
    return this.config.isProduction;
  }

  validateSecurityHeaders(req: { headers: Record<string, string> }): boolean {
    // Additional runtime security validation
    return (
      req.headers['x-forwarded-proto'] === 'https' || this.config.isDevelopment
    );
  }
}
