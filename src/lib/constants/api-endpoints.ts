export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  
  CLIENT: {
    PROJECTS: '/api/client/projects',
    INVOICES: '/api/client/invoices',
    PAYMENT: '/api/client/payment',
    DASHBOARD: '/api/client/dashboard',
  },
  
  ADMIN: {
    USERS: '/api/admin/users',
    PROJECTS: '/api/admin/projects',
    JOBS: '/api/admin/jobs',
    JOB_STATUS: '/api/admin/jobs/status',
    PERFORMANCE: '/api/admin/performance',
    PERFORMANCE_INTELLIGENCE: '/api/admin/performance-intelligence',
    CACHE: '/api/admin/cache',
    CACHE_MANAGE: '/api/admin/cache-manage',
    BI_SUMMARY: '/api/admin/bi/summary',
    BI_REVENUE: '/api/admin/bi/revenue',
    BI_USERS: '/api/admin/bi/users',
    BI_PROJECTS: '/api/admin/bi/projects',
    PATTERN_RECOGNITION: '/api/admin/pattern-recognition',
    PERFORMANCE_OPTIMIZATION: '/api/admin/performance-optimization',
    POSTS: '/api/admin/posts',
    PAGES: '/api/admin/pages',
    TEMPLATES: '/api/admin/templates',
  },
  
  PUBLIC: {
    TEMPLATES: '/api/templates',
    POSTS: '/api/posts',
    PAGES: '/api/pages',
    DOCS: '/api/docs',
  },
  
  WEBSOCKET: {
    CONNECT: '/api/websocket/connect',
    BROADCAST: '/api/websocket/broadcast',
    CONNECTIONS: '/api/websocket/connections',
    TOKEN: '/api/websocket/token',
  },
  
  GRAPHQL: '/api/graphql',
  
  WEBHOOKS: {
    MIDTRANS: '/api/webhooks/midtrans',
  },
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;