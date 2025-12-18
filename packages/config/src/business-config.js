"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnvProduction = exports.isEnvTest = exports.isEnvDevelopment = exports.getCacheConfig = exports.getNetworkConfig = exports.getSecurityConfig = exports.getEmailConfig = exports.getSiteConfig = exports.BUSINESS_CONFIG = void 0;
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';
exports.BUSINESS_CONFIG = {
    site: {
        name: process.env.SITE_NAME || 'JasaWeb',
        description: process.env.SITE_DESCRIPTION || 'Professional Web Development Services',
        author: process.env.SITE_AUTHOR || 'JasaWeb Team',
        tagline: process.env.SITE_TAGLINE || 'Jasa pembuatan website profesional',
        metaDescription: process.env.SITE_META_DESCRIPTION ||
            'Professional web development services for schools, news portals, and company profiles',
        urls: {
            production: process.env.PRODUCTION_SITE_URL || 'https://jasaweb.com',
            development: process.env.DEV_SITE_URL || 'http://localhost:4321',
            api: process.env.API_URL ||
                (isDevelopment ? 'http://localhost:3000' : 'https://api.jasaweb.com'),
            cdn: process.env.CDN_URL || 'https://cdn.jasaweb.com',
        },
        social: {
            instagram: process.env.SOCIAL_INSTAGRAM || 'https://instagram.com/jasaweb',
            facebook: process.env.SOCIAL_FACEBOOK || 'https://facebook.com/jasaweb',
            twitter: process.env.SOCIAL_TWITTER || 'https://twitter.com/jasaweb',
            linkedin: process.env.SOCIAL_LINKEDIN || 'https://linkedin.com/company/jasaweb',
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
        maxFileUploadSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
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
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MS || '900000'),
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        passwordMaxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90'),
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
            maxAge: parseInt(process.env.CORS_MAX_AGE || (isProduction ? '86400' : '3600')),
            allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:4321',
                'http://localhost:3000',
                'https://jasaweb.com',
                'https://www.jasaweb.com',
            ],
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? '100' : '1000')),
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
        defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
        dashboardTtl: parseInt(process.env.CACHE_DASHBOARD_TTL || '60'),
        projectTtl: parseInt(process.env.CACHE_PROJECT_TTL || '180'),
        sessionTtl: parseInt(process.env.CACHE_SESSION_TTL || '86400'),
    },
};
const getSiteConfig = () => exports.BUSINESS_CONFIG.site;
exports.getSiteConfig = getSiteConfig;
const getEmailConfig = () => exports.BUSINESS_CONFIG.emails;
exports.getEmailConfig = getEmailConfig;
const getSecurityConfig = () => exports.BUSINESS_CONFIG.security;
exports.getSecurityConfig = getSecurityConfig;
const getNetworkConfig = () => exports.BUSINESS_CONFIG.network;
exports.getNetworkConfig = getNetworkConfig;
const getCacheConfig = () => exports.BUSINESS_CONFIG.cache;
exports.getCacheConfig = getCacheConfig;
const isEnvDevelopment = () => isDevelopment;
exports.isEnvDevelopment = isEnvDevelopment;
const isEnvTest = () => isTest;
exports.isEnvTest = isEnvTest;
const isEnvProduction = () => isProduction;
exports.isEnvProduction = isEnvProduction;
exports.default = exports.BUSINESS_CONFIG;
//# sourceMappingURL=business-config.js.map