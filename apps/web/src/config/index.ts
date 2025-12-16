/**
 * Centralized configuration for JasaWeb Web Application
 * This file contains all configuration values that should be configurable
 * rather than hardcoded throughout the application.
 */

export const apiConfig = {
  // Base URLs (environment configurable)
  baseUrl: import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001',
  webUrl: import.meta.env.PUBLIC_WEB_URL || 'http://localhost:4321',
  siteUrl: import.meta.env.PUBLIC_SITE_URL || 'https://jasaweb.id',

  // Specific endpoint URLs for backward compatibility
  analyticsEndpoint: `${import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/analytics`,
  knowledgeBaseEndpoint: `${import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/knowledge-base`,
  dashboardEndpoint: `${import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/dashboard/stats`,

  // API Endpoints
  endpoints: {
    analytics: '/api/analytics',
    knowledgeBase: '/api/knowledge-base',
    dashboard: '/api/dashboard/stats',
    approvals: '/api/approvals',
    projects: '/api/projects',
    tickets: '/api/tickets',
    invoices: '/api/invoices',
    files: '/api/files',
    milestones: '/api/milestones',
    users: '/api/users',
    organizations: '/api/organizations',
  },

  // Network Configuration
  network: {
    requestTimeout: parseInt(import.meta.env.PUBLIC_REQUEST_TIMEOUT) || 30000,
    retryDelay: parseInt(import.meta.env.PUBLIC_RETRY_DELAY) || 1000,
    maxRetries: parseInt(import.meta.env.PUBLIC_MAX_RETRIES) || 3,
  },

  // Request timeout for backward compatibility
  requestTimeout: parseInt(import.meta.env.PUBLIC_REQUEST_TIMEOUT) || 30000,

  // Cache Configuration
  cache: {
    analyticsTTL: parseInt(import.meta.env.PUBLIC_ANALYTICS_CACHE_TTL) || 300,
    dashboardTTL: parseInt(import.meta.env.PUBLIC_DASHBOARD_CACHE_TTL) || 60,
    knowledgeBaseTTL:
      parseInt(import.meta.env.PUBLIC_KNOWLEDGE_BASE_CACHE_TTL) || 600,
  },
};

export const uiConfig = {
  // Theme colors
  colors: {
    primary: {
      main: '#3B82F6',
      dark: '#2563EB',
    },
    success: {
      main: '#10B981',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      dark: '#DC2626',
    },
    gray: {
      main: '#6B7280',
      dark: '#4B5563',
    },
  },

  // Chart colors
  charts: {
    projects: {
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
      borderColors: ['#2563EB', '#059669', '#D97706'],
    },
    tickets: {
      colors: ['#6B7280', '#F59E0B', '#EF4444', '#991B1B'],
      borderColors: ['#4B5563', '#D97706', '#DC2626', '#7F1D1D'],
    },
  },

  // Button variants
  button: {
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2 text-base',
      lg: 'h-12 px-8 text-lg',
    },
  },

  // Loading states
  loading: {
    skeletonCount: 3,
    shimmerSpeed: '1.5s',
  },
};

export const businessConfig = {
  // Currency
  currency: {
    symbol: import.meta.env.PUBLIC_CURRENCY_SYMBOL || 'Rp',
    locale: import.meta.env.PUBLIC_CURRENCY_LOCALE || 'id-ID',
  },

  // Project statuses
  projectStatuses: {
    active: 'active',
    inProgress: 'in-progress',
    completed: 'completed',
    onHold: 'on-hold',
    cancelled: 'cancelled',
  },

  // Ticket priorities
  ticketPriorities: {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  },

  // SLA thresholds (in hours)
  slaThresholds: {
    high: parseInt(import.meta.env.PUBLIC_SLA_HIGH) || 24,
    medium: parseInt(import.meta.env.PUBLIC_SLA_MEDIUM) || 48,
    low: parseInt(import.meta.env.PUBLIC_SLA_LOW) || 72,
    critical: parseInt(import.meta.env.PUBLIC_SLA_CRITICAL) || 4,
  },

  // Business limits
  limits: {
    maxFileSize: parseInt(import.meta.env.PUBLIC_MAX_FILE_SIZE) || 10485760, // 10MB
    maxFilesPerUpload:
      parseInt(import.meta.env.PUBLIC_MAX_FILES_PER_UPLOAD) || 5,
    paginationLimit: parseInt(import.meta.env.PUBLIC_PAGINATION_LIMIT) || 10,
    searchResultsLimit:
      parseInt(import.meta.env.PUBLIC_SEARCH_RESULTS_LIMIT) || 20,
  },

  // Default periods
  defaultPeriods: {
    analytics: parseInt(import.meta.env.PUBLIC_ANALYTICS_PERIOD) || 30, // days
    performance: parseInt(import.meta.env.PUBLIC_PERFORMANCE_PERIOD) || 90, // days
  },

  // Contact information
  contact: {
    email: import.meta.env.PUBLIC_CONTACT_EMAIL || 'info@jasaweb.com',
    phone: import.meta.env.PUBLIC_CONTACT_PHONE || '+62-21-1234-5678',
    address: import.meta.env.PUBLIC_CONTACT_ADDRESS || 'Jakarta, Indonesia',
  },
};

export const notificationConfig = {
  // Desktop notifications
  desktop: {
    enabled: import.meta.env.PUBLIC_DESKTOP_NOTIFICATIONS !== 'false',
    icon: import.meta.env.PUBLIC_NOTIFICATION_ICON || '/favicon.ico',
    sound: import.meta.env.PUBLIC_NOTIFICATION_SOUND !== 'false',
  },

  // Quiet hours
  quietHours: {
    enabled: import.meta.env.PUBLIC_QUIET_HOURS !== 'false',
    start: import.meta.env.PUBLIC_QUIET_HOURS_START || '22:00', // 10 PM
    end: import.meta.env.PUBLIC_QUIET_HOURS_END || '08:00', // 8 AM
  },

  // In-app notifications
  inApp: {
    maxVisible: parseInt(import.meta.env.PUBLIC_MAX_VISIBLE_NOTIFICATIONS) || 5,
    autoHideDelay: parseInt(import.meta.env.PUBLIC_AUTO_HIDE_DELAY) || 5000, // milliseconds
    urgentAutoHideDelay:
      parseInt(import.meta.env.PUBLIC_URGENT_AUTO_HIDE_DELAY) || 10000, // milliseconds
  },

  // Email notifications
  email: {
    from: import.meta.env.PUBLIC_FROM_EMAIL || 'noreply@jasaweb.dev',
    support: import.meta.env.PUBLIC_SUPPORT_EMAIL || 'support@jasaweb.dev',
    digestFrequency: import.meta.env.PUBLIC_DIGEST_FREQUENCY || 'weekly', // daily, weekly, monthly
  },
};

export const featureFlags = {
  realTimeUpdates: true,
  advancedCharts: true,
  emailNotifications: true,
  desktopNotifications: true,
  darkMode: true,
  multiLanguage: false, // Not implemented yet
};

export const environment = {
  name: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isStaging: import.meta.env.MODE === 'staging',

  // Feature flags by environment
  debugMode: import.meta.env.MODE === 'development',
  analyticsEnabled: import.meta.env.MODE !== 'development',
};

export const routes = {
  public: {
    home: '/',
    services: '/services',
    portfolio: '/portfolio',
    blog: '/blog',
    about: '/about',
    contact: '/contact',
    login: '/login',
  },
  portal: {
    dashboard: '/dashboard',
    projects: '/projects',
    files: '/files',
    approvals: '/approvals',
    tickets: '/tickets',
    invoices: '/invoices',
    reports: '/reports',
    knowledgeBase: '/knowledge-base',
    organization: '/organization',
    settings: '/settings',
  },
};

export const config = {
  api: apiConfig,
  ui: uiConfig,
  business: businessConfig,
  notifications: notificationConfig,
  features: featureFlags,
  environment,
  routes,
};

// Type exports for TypeScript
export type ApiConfig = typeof apiConfig;
export type UiConfig = typeof uiConfig;
export type BusinessConfig = typeof businessConfig;
export type NotificationConfig = typeof notificationConfig;
export type FeatureFlags = typeof featureFlags;
export type Environment = typeof environment;
export type Routes = typeof routes;
export type Config = typeof config;
