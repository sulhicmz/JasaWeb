/**
 * Centralized configuration management for JasaWeb
 * Provides environment-specific settings and constants
 */

// Type definitions for environment variables
interface EnvVars {
  MODE?: string;
  NODE_ENV?: string;
  PUBLIC_API_URL?: string;
  PUBLIC_WEB_URL?: string;
  PUBLIC_GA_ID?: string;
  PUBLIC_EMAIL_FROM?: string;
  PUBLIC_CDN_URL?: string;
}

// Helper to safely get environment variables
const getEnvVars = (): EnvVars => {
  // Try Astro/Vite environment first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env;
  }
  // Fallback to Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env as EnvVars;
  }
  return {};
};

// Environment detection
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = getEnvVars();
  const envMode = env.MODE || env.NODE_ENV || 'development';
  return ['development', 'staging', 'production'].includes(envMode)
    ? (envMode as 'development' | 'staging' | 'production')
    : 'development';
};

const env = getEnvVars();

// API Configuration
export const API_CONFIG = {
  // Base URLs - configurable per environment
  BASE_URL:
    getEnvironment() === 'production'
      ? env.PUBLIC_API_URL || 'https://api.jasaweb.id'
      : env.PUBLIC_API_URL || 'http://localhost:3001',

  WEB_URL:
    getEnvironment() === 'production'
      ? env.PUBLIC_WEB_URL || 'https://jasaweb.id'
      : env.PUBLIC_WEB_URL || 'http://localhost:4321',

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
    },
    DASHBOARD: {
      STATS: '/dashboard/stats',
      PROJECTS: '/dashboard/projects',
      ACTIVITY: '/dashboard/activity',
      ANALYTICS: '/dashboard/analytics',
    },
    PROJECTS: {
      LIST: '/projects',
      DETAIL: (id: string) => `/projects/${id}`,
      MILESTONES: (id: string) => `/projects/${id}/milestones`,
      FILES: (id: string) => `/projects/${id}/files`,
    },
    TICKETS: '/tickets',
    INVOICES: '/invoices',
    FILES: '/files',
    NOTIFICATIONS: '/notifications',
  },

  // Timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 10000,
    UPLOAD: 300000, // 5 minutes for file uploads
    WEBSOCKET: 20000,
    REFRESH: 300000, // 5 minutes for data refresh
  },

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_FACTOR: 2,
  },
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  URL: API_CONFIG.BASE_URL.replace('http', 'ws'),
  OPTIONS: {
    timeout: API_CONFIG.TIMEOUTS.WEBSOCKET,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
  },
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'JasaWeb',
  VERSION: '1.0.0',
  DESCRIPTION: 'Web Development Service Platform',

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  // File uploads
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Cache settings
  CACHE: {
    DEFAULT_TTL: 300000, // 5 minutes
    CHART_DATA_TTL: 600000, // 10 minutes
    USER_SESSION_TTL: 1800000, // 30 minutes
  },
} as const;

// Feature Flags
export const FEATURES = {
  WEBSOCKET_NOTIFICATIONS: true,
  ANALYTICS_DASHBOARD: true,
  FILE_UPLOADS: true,
  REAL_TIME_COLLABORATION: false, // Future feature
  ADVANCED_REPORTING: false, // Future feature
} as const;

// External Services
export const EXTERNAL_SERVICES = {
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: env.PUBLIC_GA_ID || '',
    ENABLED: Boolean(env.PUBLIC_GA_ID),
  },

  EMAIL: {
    FROM_ADDRESS: env.PUBLIC_EMAIL_FROM || 'noreply@jasaweb.id',
    SUPPORT_ADDRESS: 'support@jasaweb.id',
  },

  CDN: {
    BASE_URL: env.PUBLIC_CDN_URL || '',
    ENABLED: Boolean(env.PUBLIC_CDN_URL),
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 900000, // 15 minutes
    MAX_REQUESTS: 100,
    SUCCESS_MESSAGES: true,
    SKIP_SUCCESSFUL_REQUESTS: false,
  },

  // CORS
  CORS: {
    ORIGINS:
      getEnvironment() === 'production'
        ? ['https://jasaweb.id', 'https://www.jasaweb.id']
        : ['http://localhost:4321', 'http://localhost:3000'],
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // JWT Configuration (for client-side validation only)
  JWT: {
    REFRESH_THRESHOLD: 300000, // 5 minutes before expiry
    CLOCK_SKEW_TOLERANCE: 30000, // 30 seconds
  },
} as const;

// Export environment info
export const ENVIRONMENT = {
  CURRENT: getEnvironment(),
  IS_DEVELOPMENT: getEnvironment() === 'development',
  IS_STAGING: getEnvironment() === 'staging',
  IS_PRODUCTION: getEnvironment() === 'production',
} as const;

// Utility function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
    ? API_CONFIG.BASE_URL.slice(0, -1)
    : API_CONFIG.BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

// Utility function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature];
};

// Export design tokens and constants
export * from './tokens';
export * from './constants';

// Type exports for better TypeScript support
export type ApiEndpoint = keyof typeof API_CONFIG.ENDPOINTS;
export type FeatureFlag = keyof typeof FEATURES;
export type Environment = typeof ENVIRONMENT.CURRENT;
