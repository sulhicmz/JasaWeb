import { getApiUrl as getApiBaseUrl } from '@jasaweb/config';

/**
 * Get the API base URL for the current environment
 * This wrapper handles potential import issues and provides fallbacks
 */
export function getApiUrl(): string {
  try {
    return getApiBaseUrl();
  } catch (error) {
    // Fallback to environment-based configuration if config package fails
    const mode = import.meta.env.MODE || 'development';

    if (mode === 'production') {
      return import.meta.env.PUBLIC_API_URL || 'https://api.jasaweb.com';
    }

    return import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }
}
