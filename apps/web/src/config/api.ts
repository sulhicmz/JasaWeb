// API Configuration for JasaWeb
export const API_CONFIG = {
  // Backend API URL - configurable via environment
  BACKEND_URL: import.meta.env.PUBLIC_API_URL || 'http://localhost:3001',

  // API endpoints
  ENDPOINTS: {
    DASHBOARD: {
      STATS: '/dashboard/stats',
      RECENT_ACTIVITY: '/dashboard/recent-activity',
      PROJECTS_OVERVIEW: '/dashboard/projects-overview',
    },
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
    },
    PROJECTS: {
      LIST: '/projects',
      CREATE: '/projects',
      UPDATE: '/projects/:id',
      DELETE: '/projects/:id',
    },
    TICKETS: {
      LIST: '/tickets',
      CREATE: '/tickets',
      UPDATE: '/tickets/:id',
    },
    FILES: {
      UPLOAD: '/files/upload',
      DOWNLOAD: '/files/:id',
      LIST: '/files',
    },
    INVOICES: {
      LIST: '/invoices',
      DOWNLOAD: '/invoices/:id/download',
    },
  },

  // Request configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Cache configuration
  CACHE_DURATION: {
    STATS: 5 * 60 * 1000, // 5 minutes
    RECENT_ACTIVITY: 2 * 60 * 1000, // 2 minutes
    PROJECTS_OVERVIEW: 5 * 60 * 1000, // 5 minutes
  },
};

// Helper function to build API URLs
export function buildUrl(
  endpoint: string,
  params?: Record<string, string>
): string {
  const url = `${API_CONFIG.BACKEND_URL}${endpoint}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// Helper function to replace path parameters
export function buildPathUrl(
  template: string,
  params: Record<string, string>
): string {
  let url = template;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
}
