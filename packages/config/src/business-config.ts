/**
 * Centralized Business Configuration
 *
 * This file contains all business logic configuration that was previously hardcoded
 * throughout the application. Making these values dynamic improves:
 * - Multi-tenant support
 * - Environment-specific configuration
 * - Maintainability and scalability
 * - Security compliance
 */

import { getApiUrl, getWebUrl } from './url-config';

export interface SiteConfig {
  name: string;
  description: string;
  author: string;
  tagline: string;
  metaDescription: string;
  urls: {
    production: string;
    development: string;
    api: string;
    cdn: string;
  };
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
    linkedin: string;
  };
}

export interface EmailConfig {
  contact: string;
  info: string;
  noreply: string;
  support: string;
  admin: string;
  fromName: string;
}

export interface SecurityConfig {
  maxFileUploadSize: number; // bytes
  allowedMimeTypes: string[];
  uploadPath: string;
  jwtSecretMinLength: number;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // milliseconds
  passwordMinLength: number;
  passwordMaxAge: number; // days
  passwordPreventReuse: number;
}

export interface NetworkConfig {
  ports: {
    api: number;
    web: number;
    database: number;
    redis: number;
    minio: number;
  };
  cors: {
    maxAge: number;
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  csp: {
    fontSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
  };
}

export interface CacheConfig {
  defaultTtl: number; // seconds
  dashboardTtl: number; // seconds
  projectTtl: number; // seconds
  sessionTtl: number; // seconds
}

export interface BusinessConfig {
  site: SiteConfig;
  emails: EmailConfig;
  security: SecurityConfig;
  network: NetworkConfig;
  cache: CacheConfig;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

export const BUSINESS_CONFIG: BusinessConfig = {
  site: {
    name: process.env.SITE_NAME || 'JasaWeb',
    description:
      process.env.SITE_DESCRIPTION || 'Professional Web Development Services',
    author: process.env.SITE_AUTHOR || 'JasaWeb Team',
    tagline: process.env.SITE_TAGLINE || 'Jasa pembuatan website profesional',
    metaDescription:
      process.env.SITE_META_DESCRIPTION ||
      'Professional web development services for schools, news portals, and company profiles',
    urls: {
      production: process.env.PRODUCTION_SITE_URL || getWebUrl(),
      development: process.env.DEV_SITE_URL || 'http://localhost:4321',
      api: process.env.API_URL || getApiUrl(),
      cdn: process.env.CDN_URL || 'https://cdn.jasaweb.com',
    },
    social: {
      instagram:
        process.env.SOCIAL_INSTAGRAM || 'https://instagram.com/jasaweb',
      facebook: process.env.SOCIAL_FACEBOOK || 'https://facebook.com/jasaweb',
      twitter: process.env.SOCIAL_TWITTER || 'https://twitter.com/jasaweb',
      linkedin:
        process.env.SOCIAL_LINKEDIN || 'https://linkedin.com/company/jasaweb',
    },
  },

  emails: {
    contact: process.env.CONTACT_EMAIL || 'contact@jasaweb.com',
    info: process.env.INFO_EMAIL || 'info@jasaweb.com',
    noreply: process.env.NOREPLY_EMAIL || 'noreply@jasaweb.com',
    support: process.env.SUPPORT_EMAIL || 'support@jasaweb.com',
    admin: process.env.ADMIN_EMAIL || 'admin@jasaweb.com',
    fromName: process.env.EMAIL_FROM_NAME || 'JasaWeb',
  },

  security: {
    maxFileUploadSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    jwtSecretMinLength: parseInt(process.env.JWT_SECRET_MIN_LENGTH || '32'),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MS || '900000'), // 15 minutes
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    passwordMaxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90'), // days
    passwordPreventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5'),
  },

  network: {
    ports: {
      api: parseInt(process.env.API_PORT || '3000'),
      web: parseInt(process.env.WEB_PORT || '4321'),
      database: parseInt(process.env.DATABASE_PORT || '5432'),
      redis: parseInt(process.env.REDIS_PORT || '6379'),
      minio: parseInt(process.env.MINIO_PORT || '9000'),
    },
    cors: {
      maxAge: parseInt(
        process.env.CORS_MAX_AGE || (isProduction ? '86400' : '3600')
      ),
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:4321',
        'http://localhost:3000',
        'https://jasaweb.com',
        'https://www.jasaweb.com',
      ],
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? '100' : '1000')
      ),
    },
    csp: {
      fontSrc: process.env.CSP_FONT_SRC?.split(',') || [
        "'self'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      scriptSrc: process.env.CSP_SCRIPT_SRC?.split(',') || ["'self'"],
      styleSrc: process.env.CSP_STYLE_SRC?.split(',') || [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      imgSrc: process.env.CSP_IMG_SRC?.split(',') || [
        "'self'",
        'data:',
        'https:',
      ],
    },
  },

  cache: {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
    dashboardTtl: parseInt(process.env.CACHE_DASHBOARD_TTL || '60'), // 1 minute
    projectTtl: parseInt(process.env.CACHE_PROJECT_TTL || '180'), // 3 minutes
    sessionTtl: parseInt(process.env.CACHE_SESSION_TTL || '86400'), // 24 hours
  },
};

// Configuration getter functions for type safety
export const getSiteConfig = (): SiteConfig => BUSINESS_CONFIG.site;
export const getEmailConfig = (): EmailConfig => BUSINESS_CONFIG.emails;
export const getSecurityConfig = (): SecurityConfig => BUSINESS_CONFIG.security;
export const getNetworkConfig = (): NetworkConfig => BUSINESS_CONFIG.network;
export const getCacheConfig = (): CacheConfig => BUSINESS_CONFIG.cache;

// Environment check helpers
export const isEnvDevelopment = (): boolean => isDevelopment;
export const isEnvTest = (): boolean => isTest;
export const isEnvProduction = (): boolean => isProduction;

// Default export for easy importing
export default BUSINESS_CONFIG;
