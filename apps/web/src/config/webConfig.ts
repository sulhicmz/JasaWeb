// Web application environment configuration and validation
interface WebConfig {
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  siteAuthor: string;
  apiUrl: string;
  apiPrefix: string;
  isDev: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  enableBlog: boolean;
  enablePortfolio: boolean;
  enableContactForm: boolean;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

class WebConfigError extends Error {
  constructor(message: string) {
    super(`Web Configuration Error: ${message}`);
    this.name = 'WebConfigError';
  }
}

function validateUrl(url: string, fieldName: string): string {
  try {
    new URL(url);
    return url.replace(/\/$/, ''); // Remove trailing slash
  } catch {
    throw new WebConfigError(`Invalid ${fieldName}: ${url}`);
  }
}

function validateEmail(email: string, fieldName: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new WebConfigError(`Invalid ${fieldName}: ${email}`);
  }
  return email;
}

function getRequiredString(
  env: Record<string, string>,
  key: string,
  fallback?: string
): string {
  const value = env[key] || fallback;
  if (!value || value.trim() === '') {
    throw new WebConfigError(
      `Required environment variable ${key} is missing or empty`
    );
  }
  return value.trim();
}

function getOptionalString(
  env: Record<string, string>,
  key: string
): string | undefined {
  const value = env[key];
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

function getBoolean(
  env: Record<string, string>,
  key: string,
  fallback = false
): boolean {
  const value = env[key];
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function getLogLevel(
  env: Record<string, string>,
  fallback: 'debug' | 'info' | 'warn' | 'error' = 'info'
): 'debug' | 'info' | 'warn' | 'error' {
  const level = env.LOG_LEVEL?.toLowerCase();
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (level && validLevels.includes(level)) {
    return level as 'debug' | 'info' | 'warn' | 'error';
  }
  return fallback;
}

function createWebConfig(): WebConfig {
  const env = process.env as Record<string, string>;

  try {
    const nodeEnv = env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';

    // Get port configurations dynamically
    const webPort = env.PORT || env.WEB_PORT || 4321;
    const apiPort = env.API_PORT || 3000;
    const webHost = env.WEB_HOST || 'localhost';
    const apiHost = env.API_HOST || 'localhost';

    // Build dynamic URLs
    const siteUrl = validateUrl(
      env.SITE_URL || env.WEB_BASE_URL || `http://${webHost}:${webPort}`,
      'SITE_URL'
    );

    const apiUrl = validateUrl(
      env.PUBLIC_API_URL ||
        env.API_BASE_URL ||
        env.API_URL ||
        `http://${apiHost}:${apiPort}`,
      'API_URL'
    );

    const contactEmail = validateEmail(
      env.CONTACT_EMAIL || 'contact@jasaweb.com',
      'CONTACT_EMAIL'
    );

    return {
      siteUrl,
      siteName: env.SITE_NAME || 'JasaWeb',
      siteDescription:
        env.SITE_DESCRIPTION || 'Professional Web Development Services',
      siteAuthor: env.SITE_AUTHOR || 'JasaWeb Team',
      apiUrl,
      apiPrefix: env.API_PREFIX || 'api',
      isDev: isDevelopment,
      logLevel: getLogLevel(env),
      contactEmail,
      contactPhone: getOptionalString(env, 'CONTACT_PHONE'),
      contactAddress: getOptionalString(env, 'CONTACT_ADDRESS'),
      metaTitle:
        env.META_TITLE || 'JasaWeb - Professional Web Development Services',
      metaDescription:
        env.META_DESCRIPTION ||
        'Professional web development services for schools, news portals, and company profiles',
      metaKeywords:
        env.META_KEYWORDS ||
        'web development, website design, school website, news portal, company profile',
      ogImage: env.OG_IMAGE || '/images/og-image.jpg',
      enableBlog: getBoolean(env, 'ENABLE_BLOG', true),
      enablePortfolio: getBoolean(env, 'ENABLE_PORTFOLIO', true),
      enableContactForm: getBoolean(env, 'ENABLE_CONTACT_FORM', true),
      googleAnalyticsId: getOptionalString(env, 'GOOGLE_ANALYTICS_ID'),
      googleTagManagerId: getOptionalString(env, 'GOOGLE_TAG_MANAGER_ID'),
      facebookUrl: getOptionalString(env, 'FACEBOOK_URL'),
      twitterUrl: getOptionalString(env, 'TWITTER_URL'),
      instagramUrl: getOptionalString(env, 'INSTAGRAM_URL'),
      linkedinUrl: getOptionalString(env, 'LINKEDIN_URL'),
    };
  } catch (error: unknown) {
    if (error instanceof WebConfigError) {
      console.error('Configuration failed:', error.message);
      if (env.DEV || env.NODE_ENV === 'development') {
        throw error;
      }
      // In production, we should have better error handling
      console.error('Using fallback configuration');
      return createFallbackConfig();
    }
    throw error;
  }
}

function createFallbackConfig(): WebConfig {
  return {
    siteUrl: 'https://jasaweb.com',
    siteName: 'JasaWeb',
    siteDescription: 'Professional Web Development Services',
    siteAuthor: 'JasaWeb Team',
    apiUrl: 'https://api.jasaweb.com',
    apiPrefix: 'api',
    isDev: false,
    logLevel: 'info',
    contactEmail: 'contact@jasaweb.com',
    metaTitle: 'JasaWeb - Professional Web Development Services',
    metaDescription:
      'Professional web development services for schools, news portals, and company profiles',
    metaKeywords:
      'web development, website design, school website, news portal, company profile',
    ogImage: '/images/og-image.jpg',
    enableBlog: true,
    enablePortfolio: true,
    enableContactForm: true,
  };
}

// Create and export the configuration
const webConfig = createWebConfig();

// Export types and configuration
export type { WebConfig };
export { WebConfigError };
export default webConfig;
