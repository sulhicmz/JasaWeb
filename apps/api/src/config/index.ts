/**
 * Centralized configuration for JasaWeb API Application
 * This file contains all configuration values that should be configurable
 * rather than hardcoded throughout the application.
 */

export const apiConfig = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',

  // Application URLs
  frontendUrl: process.env.FRONTEND_URL || 'https://jasaweb.com',
  apiUrl: process.env.API_URL || 'https://api.jasaweb.com',

  // CORS configuration - configurable by environment
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:4321'
        : 'https://jasaweb.id',
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://api.jasaweb.id',
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : 'https://staging.jasaweb.id',
      'http://localhost:4321',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:4321',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'https://jasaweb.id',
      'https://www.jasaweb.id',
      'https://api.jasaweb.id',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
  },
};

export const databaseConfig = {
  // Connection details
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  name: process.env.DB_NAME || 'jasaweb',

  // Connection pool
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '2000'
    ),
  },

  // Migrations
  migrations: {
    directory: './prisma/migrations',
    schema: './prisma/schema.prisma',
  },
};

export const storageConfig = {
  // File upload limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB in bytes
  maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST || '5'),

  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],

  allowedExtensions: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.csv',
  ],

  // Storage paths
  local: {
    uploadDirectory: './uploads',
    temporaryDirectory: './temp',
  },

  // S3 configuration
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'jasaweb-files',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT, // Optional: for S3-compatible services
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },

  // File URL expiration
  signedUrlExpiry: parseInt(process.env.SIGNED_URL_EXPIRY || '3600'), // 1 hour in seconds
};

export const cacheConfig = {
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'jasaweb:',
  },

  // TTL values (in seconds)
  ttl: {
    default: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
    dashboardStats: parseInt(process.env.CACHE_DASHBOARD_TTL || '60'), // 1 minute
    projects: parseInt(process.env.CACHE_PROJECT_TTL || '180'), // 3 minutes
    analytics: parseInt(process.env.CACHE_ANALYTICS_TTL || '600'), // 10 minutes
    userSession: parseInt(process.env.CACHE_SESSION_TTL || '86400'), // 24 hours
  },
};

export const securityConfig = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    secretMinLength: 32,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'jasaweb-api',
    audience: process.env.JWT_AUDIENCE || 'jasaweb-client',
  },

  // Password configuration
  password: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  },

  // Rate limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    maxAuthRequests: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS || '10'),
    successfulRequests: parseInt(
      process.env.RATE_LIMIT_SUCCESS_REQUESTS || '5'
    ),
  },

  // Authentication security
  auth: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '900000'), // 15 minutes
    twoFactorEnabled: process.env.TWO_FACTOR_ENABLED === 'true',
    magicLinkExpiry: parseInt(process.env.MAGIC_LINK_EXPIRY || '3600'), // 1 hour
  },

  // Content Security Policy
  csp: {
    enabled: process.env.CSP_ENABLED !== 'false',
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
};

export const emailConfig = {
  // Email provider
  provider: process.env.EMAIL_PROVIDER || 'resend',

  // SMTP configuration (fallback)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  // Resend configuration
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@jasaweb.com',
    fromName: process.env.FROM_NAME || 'JasaWeb',
  },

  // Email templates
  templates: {
    welcome: {
      subject: 'Welcome to JasaWeb Client Portal',
      template: './welcome',
    },
    approvalRequest: {
      subject: (projectName: string) => `Approval Request for ${projectName}`,
      template: './approval-request',
    },
    approvalCompleted: {
      subject: (projectName: string, status: string) =>
        `Approval ${status.toUpperCase()} for ${projectName}`,
      template: './approval-completed',
    },
    ticketCreated: {
      subject: (ticketTitle: string) => `New Ticket Created: ${ticketTitle}`,
      template: './ticket-created',
    },
    ticketStatusChanged: {
      subject: (ticketId: string, newStatus: string) =>
        `Ticket #${ticketId} Status Updated: ${newStatus}`,
      template: './ticket-status-changed',
    },
    invoice: {
      subject: (invoiceNumber: string) => `New Invoice: ${invoiceNumber}`,
      template: './invoice',
    },
  },

  // Queue configuration
  queue: {
    enabled: process.env.EMAIL_QUEUE_ENABLED !== 'false',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000'), // 5 seconds
  },
};

export const businessConfig = {
  // Currency and localization
  currency: {
    default: 'IDR',
    locale: 'id-ID',
    symbol: 'Rp',
  },

  // Project configuration
  project: {
    maxProjectsPerOrg: parseInt(process.env.MAX_PROJECTS_PER_ORG || '50'),
    maxMilestonesPerProject: parseInt(
      process.env.MAX_MILESTONES_PER_PROJECT || '20'
    ),
    maxFilesPerProject: parseInt(process.env.MAX_FILES_PER_PROJECT || '100'),
  },

  // Ticket SLA - configurable by environment
  sla: {
    responseTimes: {
      critical: parseInt(process.env.SLA_CRITICAL_RESPONSE || '4'), // hours
      high: parseInt(process.env.SLA_HIGH_RESPONSE || '24'),
      medium: parseInt(process.env.SLA_MEDIUM_RESPONSE || '48'),
      low: parseInt(process.env.SLA_LOW_RESPONSE || '72'),
    },
    resolutionTimes: {
      critical: parseInt(process.env.SLA_CRITICAL_RESOLUTION || '72'), // hours
      high: parseInt(process.env.SLA_HIGH_RESOLUTION || '168'),
      medium: parseInt(process.env.SLA_MEDIUM_RESOLUTION || '336'),
      low: parseInt(process.env.SLA_LOW_RESOLUTION || '720'),
    },
    priorityOrder: ['critical', 'high', 'medium', 'low'],
  },

  // Analytics periods
  analytics: {
    defaultTrendsPeriod: parseInt(
      process.env.ANALYTICS_DEFAULT_PERIOD || '2592000000'
    ), // 30 days in ms
    maxDataRetentionDays: parseInt(
      process.env.ANALYTICS_MAX_RETENTION || '365'
    ), // 1 year
    batchIntervalMs: parseInt(process.env.ANALYTICS_BATCH_INTERVAL || '300000'), // 5 minutes
  },

  // Risk assessment thresholds - configurable
  risk: {
    highRisk: {
      overdueMilestones: parseInt(
        process.env.RISK_HIGH_OVERDUE_MILESTONES || '5'
      ),
      highRiskProjects: parseInt(process.env.RISK_HIGH_PROJECTS || '2'),
      criticalTickets: parseInt(process.env.RISK_HIGH_CRITICAL_TICKETS || '3'),
      budgetOverrunThreshold: parseFloat(
        process.env.RISK_BUDGET_OVERRUN_THRESHOLD || '0.2'
      ), // 20%
    },
    mediumRisk: {
      overdueMilestones: parseInt(
        process.env.RISK_MEDIUM_OVERDUE_MILESTONES || '2'
      ),
      highRiskProjects: parseInt(process.env.RISK_MEDIUM_PROJECTS || '0'),
      criticalTickets: parseInt(
        process.env.RISK_MEDIUM_CRITICAL_TICKETS || '1'
      ),
      budgetOverrunThreshold: parseFloat(
        process.env.RISK_BUDGET_OVERRUN_THRESHOLD || '0.1'
      ), // 10%
    },
    lowRisk: {
      overdueMilestones: parseInt(
        process.env.RISK_LOW_OVERDUE_MILESTONES || '0'
      ),
      highRiskProjects: parseInt(process.env.RISK_LOW_PROJECTS || '0'),
      criticalTickets: parseInt(process.env.RISK_LOW_CRITICAL_TICKETS || '0'),
      budgetOverrunThreshold: parseFloat(
        process.env.RISK_BUDGET_OVERRUN_THRESHOLD || '0.05'
      ), // 5%
    },
  },

  // Team capacity planning
  teamCapacity: {
    hoursPerProjectPerWeek: parseInt(
      process.env.HOURS_PER_PROJECT_PER_WEEK || '40'
    ),
    hoursPerTeamMemberPerWeek: parseInt(
      process.env.HOURS_PER_TEAM_MEMBER_PER_WEEK || '35'
    ),
    utilizationTarget: parseFloat(process.env.UTILIZATION_TARGET || '0.8'), // 80%
    capacityBuffer: parseFloat(process.env.CAPACITY_BUFFER || '0.2'), // 20%
  },
};

export const monitoringConfig = {
  // Health checks
  healthCheck: {
    intervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'), // 5 seconds
    endpoints: {
      database: '/health/database',
      redis: '/health/redis',
      storage: '/health/storage',
      email: '/health/email',
    },
  },

  // Metrics and telemetry
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: process.env.METRICS_PREFIX || 'jasaweb_',
    collectionInterval: parseInt(
      process.env.METRICS_COLLECTION_INTERVAL || '60000'
    ), // 1 minute
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    auditLogEnabled: process.env.AUDIT_LOG_ENABLED !== 'false',
    auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'), // 90 days
  },

  // Error tracking
  errorTracking: {
    enabled: process.env.ERROR_TRACKING_ENABLED !== 'false',
    dsn: process.env.ERROR_TRACKING_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    sampleRate: parseFloat(process.env.ERROR_SAMPLE_RATE || '1.0'),
  },
};

export const environment = {
  name: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',
  isTest: process.env.NODE_ENV === 'test',

  // Debug mode
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',

  // Feature flags
  features: {
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS !== 'false',
    realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES !== 'false',
    advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
  },
};

export const config = {
  api: apiConfig,
  database: databaseConfig,
  storage: storageConfig,
  cache: cacheConfig,
  security: securityConfig,
  email: emailConfig,
  business: businessConfig,
  monitoring: monitoringConfig,
  environment,
};

// Type exports for TypeScript
export type ApiConfig = typeof apiConfig;
export type DatabaseConfig = typeof databaseConfig;
export type StorageConfig = typeof storageConfig;
export type CacheConfig = typeof cacheConfig;
export type SecurityConfig = typeof securityConfig;
export type EmailConfig = typeof emailConfig;
export type BusinessConfig = typeof businessConfig;
export type MonitoringConfig = typeof monitoringConfig;
export type Environment = typeof environment;
export type Config = typeof config;
