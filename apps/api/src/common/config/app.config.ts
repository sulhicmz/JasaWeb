import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (
  value: string | undefined,
  fallback: boolean
): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

export default registerAs('app', () => ({
  // Application Configuration
  name: process.env.APP_NAME || 'JasaWeb API',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4321',
    prefix: process.env.API_PREFIX || 'api',
    version: process.env.API_VERSION || 'v1',
    timeout: parseNumber(process.env.API_TIMEOUT, 30000), // 30 seconds
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseNumber(process.env.DATABASE_POOL_SIZE, 10),
    connectionTimeout: parseNumber(
      process.env.DATABASE_CONNECTION_TIMEOUT,
      30000
    ),
    queryTimeout: parseNumber(process.env.DATABASE_QUERY_TIMEOUT, 30000),
  },

  // Cache Configuration
  cache: {
    ttl: parseNumber(process.env.CACHE_TTL, 300), // 5 minutes instead of 5 seconds
    max: parseNumber(process.env.CACHE_MAX, 1000), // Increased cache size
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseNumber(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD,
      db: parseNumber(process.env.REDIS_DB, 0),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'jasaweb:',
      retryDelayOnFailover: parseNumber(process.env.REDIS_RETRY_DELAY, 100),
      maxRetriesPerRequest: parseNumber(process.env.REDIS_MAX_RETRIES, 3),
    },
  },

  // Throttling Configuration
  throttling: {
    ttl: parseNumber(process.env.THROTTLE_TTL, 60),
    limit: parseNumber(process.env.THROTTLE_LIMIT, 100),
  },

  // File Upload Configuration
  upload: {
    maxSize: parseNumber(process.env.UPLOAD_MAX_SIZE, 10 * 1024 * 1024), // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    destination: process.env.UPLOAD_DESTINATION || './uploads',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseNumber(process.env.EMAIL_PORT, 587),
    secure: parseBoolean(process.env.EMAIL_SECURE, false),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@jasaweb.com',
    templatesPath: process.env.EMAIL_TEMPLATES_PATH || './templates',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseNumber(process.env.LOG_MAX_FILES, 14),
  },

  // Monitoring Configuration
  monitoring: {
    enabled: parseBoolean(process.env.MONITORING_ENABLED, true),
    metricsPath: process.env.METRICS_PATH || '/metrics',
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',
  },

  // Feature Flags
  features: {
    registration: parseBoolean(process.env.FEATURE_REGISTRATION, true),
    emailVerification: parseBoolean(
      process.env.FEATURE_EMAIL_VERIFICATION,
      true
    ),
    passwordReset: parseBoolean(process.env.FEATURE_PASSWORD_RESET, true),
    multiTenancy: parseBoolean(process.env.FEATURE_MULTI_TENANCY, true),
    analytics: parseBoolean(process.env.FEATURE_ANALYTICS, true),
    knowledgeBase: parseBoolean(process.env.FEATURE_KNOWLEDGE_BASE, true),
    fileManagement: parseBoolean(process.env.FEATURE_FILE_MANAGEMENT, true),
    approvals: parseBoolean(process.env.FEATURE_APPROVALS, true),
    invoices: parseBoolean(process.env.FEATURE_INVOICES, true),
  },

  // Business Configuration
  business: {
    company: {
      name: process.env.COMPANY_NAME || 'JasaWeb',
      email: process.env.COMPANY_EMAIL || 'contact@jasaweb.com',
      phone: process.env.COMPANY_PHONE || '+62-21-1234-5678',
      address: process.env.COMPANY_ADDRESS || 'Jakarta, Indonesia',
      website: process.env.COMPANY_WEBSITE || 'https://jasaweb.com',
    },
    services: {
      schoolWebsite: {
        enabled: true,
        basePrice: parseNumber(process.env.SCHOOL_WEBSITE_BASE_PRICE, 15000000),
        deliveryWeeks: parseNumber(
          process.env.SCHOOL_WEBSITE_DELIVERY_WEEKS,
          8
        ),
      },
      newsPortal: {
        enabled: true,
        basePrice: parseNumber(process.env.NEWS_PORTAL_BASE_PRICE, 20000000),
        deliveryWeeks: parseNumber(process.env.NEWS_PORTAL_DELIVERY_WEEKS, 10),
      },
      companyProfile: {
        enabled: true,
        basePrice: parseNumber(
          process.env.COMPANY_PROFILE_BASE_PRICE,
          10000000
        ),
        deliveryWeeks: parseNumber(
          process.env.COMPANY_PROFILE_DELIVERY_WEEKS,
          6
        ),
      },
    },
  },
}));
