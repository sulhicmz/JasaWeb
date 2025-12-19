/**
 * Environment-aware URL and host configuration utilities
 * Replaces hardcoded localhost/URL references with dynamic values
 */

/**
 * Service port configuration
 */
export const SERVICE_PORTS = {
  WEB: 4321,
  API: 3000,
  WEB_DEV: 3001,
  REDIS: 6379,
  POSTGRES: 5432,
  MINIO: 9000,
} as const;

/**
 * Host configuration with environment awareness
 */
export const HOSTS = {
  get DEVELOPMENT() {
    return process.env.NODE_ENV === 'development';
  },
  get PRODUCTION() {
    return process.env.NODE_ENV === 'production';
  },
  get TEST() {
    return process.env.NODE_ENV === 'test';
  },

  // Service hosts - configurable via environment variables
  get WEB_HOST() {
    return process.env.WEB_HOST || 'localhost';
  },
  get API_HOST() {
    return process.env.API_HOST || 'localhost';
  },
  get DATABASE_HOST() {
    return process.env.POSTGRES_HOST || 'localhost';
  },
  get REDIS_HOST() {
    return process.env.REDIS_HOST || 'localhost';
  },
  get MINIO_HOST() {
    return process.env.MINIO_HOST || 'localhost';
  },

  // Production URLs
  get FRONTEND_URL() {
    return process.env.FRONTEND_URL;
  },
  get API_BASE_URL() {
    return process.env.API_BASE_URL;
  },
} as const;

/**
 * Dynamic URL generation based on environment
 */
export class UrlBuilder {
  /**
   * Generate service URL with environment awareness
   */
  static getServiceUrl(
    service: 'web' | 'api',
    options: {
      host?: string;
      port?: number;
      protocol?: 'http' | 'https';
      includePath?: boolean;
    } = {}
  ): string {
    const {
      host = service === 'web' ? HOSTS.WEB_HOST : HOSTS.API_HOST,
      port = service === 'web' ? SERVICE_PORTS.WEB : SERVICE_PORTS.API,
      protocol = HOSTS.PRODUCTION ? 'https' : 'http',
      includePath = false,
    } = options;

    const baseUrl = `${protocol}://${host}${port ? `:${port}` : ''}`;

    if (includePath) {
      return service === 'api' ? `${baseUrl}/api` : baseUrl;
    }

    return baseUrl;
  }

  /**
   * Get all allowed CORS origins based on environment
   */
  static getAllowedOrigins(): string[] {
    const origins: string[] = [];

    // Add production URLs if available
    if (HOSTS.FRONTEND_URL) {
      origins.push(HOSTS.FRONTEND_URL);
    }
    if (HOSTS.API_BASE_URL) {
      origins.push(HOSTS.API_BASE_URL);
    }

    // Add development URLs
    if (HOSTS.DEVELOPMENT) {
      origins.push(
        UrlBuilder.getServiceUrl('web'),
        UrlBuilder.getServiceUrl('api'),
        UrlBuilder.getServiceUrl('web', { port: SERVICE_PORTS.WEB_DEV }),
        `http://127.0.0.1:${SERVICE_PORTS.WEB}`,
        `http://127.0.0.1:${SERVICE_PORTS.API}`,
        `http://127.0.0.1:${SERVICE_PORTS.WEB_DEV}`,
        UrlBuilder.getServiceUrl('api', { host: '127.0.0.1' }),
        UrlBuilder.getServiceUrl('web', { host: '127.0.0.1' })
      );
    }

    // Add test URLs
    if (HOSTS.TEST) {
      origins.push('http://localhost:*', 'http://127.0.0.1:*');
    }

    return origins;
  }

  /**
   * Get database URL with proper configuration
   */
  static getDatabaseUrl(
    options: {
      user?: string;
      password?: string;
      database?: string;
      ssl?: boolean;
    } = {}
  ): string {
    const {
      user = process.env.POSTGRES_USER || 'postgres',
      password = process.env.POSTGRES_PASSWORD || 'postgres',
      database = process.env.POSTGRES_DATABASE || 'jasaweb',
      ssl = HOSTS.PRODUCTION,
    } = options;

    const host = HOSTS.DATABASE_HOST;
    const port = SERVICE_PORTS.POSTGRES;

    return `postgresql://${user}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`;
  }

  /**
   * Get Redis connection URL
   */
  static getRedisUrl(
    options: {
      password?: string;
      database?: number;
    } = {}
  ): string {
    const { password, database = 0 } = options;
    const host = HOSTS.REDIS_HOST;
    const port = SERVICE_PORTS.REDIS;

    let url = `redis://`;
    if (password) {
      url += `:${password}@`;
    }
    url += `${host}:${port}/${database}`;

    return url;
  }

  /**
   * Get S3/MinIO URL
   */
  static getStorageUrl(
    options: {
      bucket?: string;
      ssl?: boolean;
    } = {}
  ): string {
    const {
      bucket = process.env.MINIO_BUCKET || 'jasaweb',
      ssl = HOSTS.PRODUCTION,
    } = options;

    const protocol = ssl ? 'https' : 'http';
    const host = HOSTS.MINIO_HOST;
    const port = SERVICE_PORTS.MINIO;

    return `${protocol}://${host}:${port}/${bucket}`;
  }
}

/**
 * WebSocket URL generation
 */
export class WebSocketUrlBuilder {
  /**
   * Get WebSocket URL for real-time connections
   */
  static getWebSocketUrl(service: 'api' | 'web' = 'api'): string {
    const protocol = HOSTS.PRODUCTION ? 'wss' : 'ws';
    const host = service === 'api' ? HOSTS.API_HOST : HOSTS.WEB_HOST;
    const port = service === 'api' ? SERVICE_PORTS.API : SERVICE_PORTS.WEB;

    return `${protocol}://${host}${port ? `:${port}` : ''}`;
  }

  /**
   * Get allowed WebSocket origins
   */
  static getAllowedWebSocketOrigins(): string[] {
    const origins: string[] = [];

    if (HOSTS.DEVELOPMENT) {
      origins.push(
        WebSocketUrlBuilder.getWebSocketUrl('api'),
        WebSocketUrlBuilder.getWebSocketUrl('web'),
        `ws://localhost:*`,
        `ws://127.0.0.1:*`
      );
    }

    return origins;
  }
}

/**
 * Service health check URLs
 */
export const HEALTH_CHECKS = {
  get DATABASE_URL() {
    return UrlBuilder.getDatabaseUrl();
  },
  get REDIS_URL() {
    return UrlBuilder.getRedisUrl();
  },
  get STORAGE_URL() {
    return UrlBuilder.getStorageUrl();
  },
} as const;
