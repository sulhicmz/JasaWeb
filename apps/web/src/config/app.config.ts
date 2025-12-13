// Frontend configuration for JasaWeb
export const API_CONFIG = {
  baseUrl: import.meta.env.PUBLIC_API_URL || 'http://localhost:3000',
  timeout: parseInt(import.meta.env.PUBLIC_API_TIMEOUT || '10000'),
  version: import.meta.env.PUBLIC_API_VERSION || 'v1',
  prefix: import.meta.env.PUBLIC_API_PREFIX || 'api',
};

export const APP_CONFIG = {
  name: import.meta.env.PUBLIC_APP_NAME || 'JasaWeb',
  version: import.meta.env.PUBLIC_APP_VERSION || '1.0.0',
  description:
    import.meta.env.PUBLIC_APP_DESCRIPTION ||
    'Professional Web Development Services',
  author: import.meta.env.PUBLIC_APP_AUTHOR || 'JasaWeb Team',
  baseUrl: import.meta.env.PUBLIC_BASE_URL || 'http://localhost:4321',
  environment: import.meta.env.PUBLIC_ENVIRONMENT || 'development',
};

export const BUSINESS_CONFIG = {
  company: {
    name: import.meta.env.PUBLIC_COMPANY_NAME || 'JasaWeb',
    email: import.meta.env.PUBLIC_COMPANY_EMAIL || 'contact@jasaweb.com',
    phone: import.meta.env.PUBLIC_COMPANY_PHONE || '+62-21-1234-5678',
    address: import.meta.env.PUBLIC_COMPANY_ADDRESS || 'Jakarta, Indonesia',
    website: import.meta.env.PUBLIC_COMPANY_WEBSITE || 'https://jasaweb.com',
  },
  services: {
    schoolWebsite: {
      name: 'School Website',
      description: 'Professional educational institution websites',
      basePrice: parseInt(
        import.meta.env.PUBLIC_SCHOOL_WEBSITE_BASE_PRICE || '15000000'
      ),
      deliveryWeeks: parseInt(
        import.meta.env.PUBLIC_SCHOOL_WEBSITE_DELIVERY_WEEKS || '8'
      ),
    },
    newsPortal: {
      name: 'News Portal',
      description: 'Modern news and media platforms',
      basePrice: parseInt(
        import.meta.env.PUBLIC_NEWS_PORTAL_BASE_PRICE || '20000000'
      ),
      deliveryWeeks: parseInt(
        import.meta.env.PUBLIC_NEWS_PORTAL_DELIVERY_WEEKS || '10'
      ),
    },
    companyProfile: {
      name: 'Company Profile',
      description: 'Professional business websites',
      basePrice: parseInt(
        import.meta.env.PUBLIC_COMPANY_PROFILE_BASE_PRICE || '10000000'
      ),
      deliveryWeeks: parseInt(
        import.meta.env.PUBLIC_COMPANY_PROFILE_DELIVERY_WEEKS || '6'
      ),
    },
  },
};

export const UI_CONFIG = {
  theme: {
    primaryColor: import.meta.env.PUBLIC_PRIMARY_COLOR || '#3b82f6',
    secondaryColor: import.meta.env.PUBLIC_SECONDARY_COLOR || '#64748b',
    accentColor: import.meta.env.PUBLIC_ACCENT_COLOR || '#f59e0b',
    darkMode: import.meta.env.PUBLIC_DARK_MODE !== 'false',
  },
  animations: {
    enabled: import.meta.env.PUBLIC_ANIMATIONS_ENABLED !== 'false',
    duration: parseInt(import.meta.env.PUBLIC_ANIMATION_DURATION || '300'),
  },
  features: {
    analytics: import.meta.env.PUBLIC_ANALYTICS_ENABLED !== 'false',
    chat: import.meta.env.PUBLIC_CHAT_ENABLED !== 'false',
    notifications: import.meta.env.PUBLIC_NOTIFICATIONS_ENABLED !== 'false',
    darkModeToggle: import.meta.env.PUBLIC_DARK_MODE_TOGGLE !== 'false',
  },
};

export const MONITORING_CONFIG = {
  enabled: import.meta.env.PUBLIC_MONITORING_ENABLED !== 'false',
  analyticsId: import.meta.env.PUBLIC_ANALYTICS_ID,
  sentryDsn: import.meta.env.PUBLIC_SENTRY_DSN,
  debugMode: import.meta.env.PUBLIC_DEBUG_MODE === 'true',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
  const prefix = API_CONFIG.prefix.replace(/^\/|\/$/g, '');
  const version = API_CONFIG.version.replace(/^\/|\/$/g, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');

  return `${baseUrl}/${prefix}/${version}/${cleanEndpoint}`;
};

// Helper function for API requests
export const createApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = getApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};
