/**
 * Application Constants
 * Centralized magic numbers and constants for better maintainability
 */

// Time constants (in milliseconds)
export const TIME = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Animation and transition durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SLOWER: 1000,
  CHART_UPDATE: 750,
  LOADING_SPINNER: 1000,
  PAGE_TRANSITION: 250,
  TOAST_NOTIFICATION: 300,
  MODAL_FADE: 200,
} as const;

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD_DATA: 30000, // 30 seconds
  REAL_TIME_STATS: 10000, // 10 seconds
  WEBSOCKET_PING: 5000, // 5 seconds
  CHART_DATA: 60000, // 1 minute
  NOTIFICATION_CHECK: 15000, // 15 seconds
  ACTIVITY_FEED: 20000, // 20 seconds
} as const;

// Timeout values (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  FILE_UPLOAD: 300000, // 5 minutes
  WEBSOCKET_CONNECTION: 20000, // 20 seconds
  USER_SESSION: 1800000, // 30 minutes
  CACHE_EXPIRY: 300000, // 5 minutes
  IDLE_WARNING: 900000, // 15 minutes
  AUTO_LOGOUT: 1800000, // 30 minutes
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
  DEFAULT_PAGE: 1,
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_FILES_PER_UPLOAD: 10,
} as const;

// Chart dimensions
export const CHART_DIMENSIONS = {
  DEFAULT_HEIGHT: 250,
  LARGE_HEIGHT: 300,
  SMALL_HEIGHT: 200,
  MINI_HEIGHT: 150,
  DEFAULT_WIDTH: '100%',
  ASPECT_RATIO: 16 / 9,
} as const;

// WebSocket configuration
export const WEBSOCKET = {
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  TIMEOUT: 20000,
  PING_INTERVAL: 5000,
  PONG_TIMEOUT: 10000,
} as const;

// Rate limiting
export const RATE_LIMITING = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  UPLOAD_ATTEMPTS: 10,
  UPLOAD_WINDOW_MS: 60 * 60 * 1000, // 1 hour
} as const;

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  USER_DATA: 300000, // 5 minutes
  DASHBOARD_STATS: 300000, // 5 minutes
  PROJECT_LIST: 600000, // 10 minutes
  CHART_DATA: 600000, // 10 minutes
  STATIC_ASSETS: 86400000, // 24 hours
  API_RESPONSES: 60000, // 1 minute
} as const;

// Validation constraints
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  COMMENT_MAX_LENGTH: 500,
  TITLE_MAX_LENGTH: 200,
} as const;

// Database query limits
export const DB_LIMITS = {
  MAX_SELECT_RECORDS: 1000,
  DEFAULT_SELECT_LIMIT: 50,
  MAX_UPDATE_RECORDS: 100,
  MAX_DELETE_RECORDS: 50,
  BATCH_SIZE: 100,
} as const;

// Notification settings
export const NOTIFICATIONS = {
  MAX_VISIBLE: 5,
  DEFAULT_DURATION: 5000, // 5 seconds
  SUCCESS_DURATION: 3000, // 3 seconds
  ERROR_DURATION: 8000, // 8 seconds
  WARNING_DURATION: 6000, // 6 seconds
  INFO_DURATION: 4000, // 4 seconds
} as const;

// Search configuration
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_RESULTS: 50,
  HIGHLIGHT_LENGTH: 150, // characters
} as const;

// Dashboard widget settings
export const DASHBOARD_WIDGETS = {
  MAX_WIDGETS_PER_ROW: 4,
  MIN_WIDGET_HEIGHT: 200,
  MAX_WIDGET_HEIGHT: 600,
  DEFAULT_WIDGET_HEIGHT: 300,
  GRID_COLUMNS: 12,
  GRID_GAP: 16, // pixels
} as const;

// Performance monitoring
export const PERFORMANCE = {
  VITAL_THRESHOLDS: {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100, // First Input Delay (ms)
    CLS: 0.1, // Cumulative Layout Shift
    TTFB: 800, // Time to First Byte (ms)
  },
  SAMPLING_RATE: 0.1, // 10% sampling
  MAX_EVENTS_PER_BATCH: 50,
  BATCH_INTERVAL: 10000, // 10 seconds
} as const;

// Security settings
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  PASSWORD_SALT_ROUNDS: 12,
  CSRF_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
} as const;

// Email settings
export const EMAIL = {
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB
  SEND_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  SHORT_DATE: 'MM/dd/yyyy',
  SHORT_TIME: 'HH:mm',
  FILENAME: 'yyyy-MM-dd_HH-mm-ss',
} as const;

// Export utility functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

export const calculatePages = (total: number, pageSize: number): number => {
  return Math.ceil(total / pageSize);
};

// Type exports
export type TimeUnit = keyof typeof TIME;
export type AnimationDuration = keyof typeof ANIMATION_DURATION;
export type RefreshInterval = keyof typeof REFRESH_INTERVALS;
export type Timeout = keyof typeof TIMEOUTS;
