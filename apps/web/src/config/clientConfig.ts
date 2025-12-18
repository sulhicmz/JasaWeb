/**
 * Client-side configuration for Astro components
 * Provides environment variables and API configuration for client-side scripts
 */

// Get configuration from import.meta.env (available at build time)
export const CLIENT_CONFIG = {
  // Site configuration
  siteUrl: import.meta.env.SITE_URL || 'http://localhost:4321',
  siteBaseUrl: import.meta.env.SITE_BASE_URL || 'https://jasaweb.id',

  // API configuration
  apiUrl:
    import.meta.env.PUBLIC_API_URL ||
    import.meta.env.API_URL ||
    'http://localhost:3000',

  // Timeouts
  apiTimeout: parseInt(import.meta.env.API_TIMEOUT || '30000'),
  requestTimeout: parseInt(import.meta.env.REQUEST_TIMEOUT || '10000'),

  // Contact form
  contactEmail: import.meta.env.CONTACT_EMAIL || 'contact@jasaweb.com',

  // Social media
  facebookUrl: import.meta.env.FACEBOOK_URL || 'https://facebook.com/jasaweb',
  twitterUrl: import.meta.env.TWITTER_URL || 'https://twitter.com/jasaweb',
  linkedinUrl:
    import.meta.env.LINKEDIN_URL || 'https://linkedin.com/company/jasaweb',
  instagramUrl:
    import.meta.env.INSTAGRAM_URL || 'https://instagram.com/jasaweb',

  // Styling
  primaryColor: import.meta.env.PRIMARY_COLOR || '#3B82F6',
  secondaryColor: import.meta.env.SECONDARY_COLOR || '#10B981',
  successColor: import.meta.env.SUCCESS_COLOR || '#059669',
  warningColor: import.meta.env.WARNING_COLOR || '#D97706',
  errorColor: import.meta.env.ERROR_COLOR || '#DC2626',

  // Feature flags
  devMode: import.meta.env.DEV_MODE === 'true',
  enableBlog: import.meta.env.ENABLE_BLOG === 'true',
  enablePortfolio: import.meta.env.ENABLE_PORTFOLIO === 'true',
  enableContactForm: import.meta.env.ENABLE_CONTACT_FORM === 'true',
} as const;

// Utility function to get auth headers for API requests
export const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('authToken')
      : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add organization ID if available
  const orgId =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('organizationId')
      : null;
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }

  return headers;
};

// Utility function for making API requests in client-side scripts
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${CLIENT_CONFIG.apiUrl}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    CLIENT_CONFIG.requestTimeout
  );

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Common API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
  },
  MILESTONES: {
    LIST: '/milestones',
    CREATE: '/milestones',
    UPDATE: (id: string) => `/milestones/${id}`,
    DELETE: (id: string) => `/milestones/${id}`,
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    PROJECTS_OVERVIEW: '/dashboard/projects-overview',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
  },
} as const;

export default CLIENT_CONFIG;
