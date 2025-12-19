/**
 * Unified Configuration Validator
 * Standardizes environment URL management across the JasaWeb monorepo
 */

export interface EnvironmentUrls {
  apiBaseUrl: string;
  webBaseUrl: string;
  frontendUrl: string;
  websocketUrl: string;
  corsOrigins: string[];
}

export interface PortConfiguration {
  api: number;
  web: number;
  database: number;
  redis: number;
  minio: number;
}

export interface HostConfiguration {
  apiHost: string;
  webHost: string;
  databaseHost: string;
  redisHost: string;
  minioHost: string;
}

export class ConfigurationValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(`Configuration Validation Error: ${message}`);
    this.name = 'ConfigurationValidationError';
  }
}

export class EnvironmentUrlValidator {
  private static readonly DEFAULT_PORTS: PortConfiguration = {
    api: 3000,
    web: 4321,
    database: 5432,
    redis: 6379,
    minio: 9000,
  };

  private static readonly DEFAULT_HOSTS: HostConfiguration = {
    apiHost: 'localhost',
    webHost: 'localhost',
    databaseHost: 'localhost',
    redisHost: 'localhost',
    minioHost: 'localhost',
  };

  /**
   * Validates and normalizes a URL
   */
  static validateUrl(url: string, fieldName: string): string {
    if (!url || typeof url !== 'string') {
      throw new ConfigurationValidationError(
        `URL is required and must be a string`,
        fieldName
      );
    }

    try {
      const normalizedUrl = new URL(url);
      return normalizedUrl.origin; // Returns protocol + host + port without trailing slash
    } catch {
      throw new ConfigurationValidationError(
        `Invalid URL format: ${url}`,
        fieldName
      );
    }
  }

  /**
   * Validates and normalizes a WebSocket URL
   */
  static validateWebSocketUrl(url: string, fieldName: string): string {
    if (!url || typeof url !== 'string') {
      throw new ConfigurationValidationError(
        `WebSocket URL is required and must be a string`,
        fieldName
      );
    }

    try {
      // Convert HTTP URL to WebSocket URL if needed
      if (url.startsWith('http://')) {
        return url.replace('http://', 'ws://');
      } else if (url.startsWith('https://')) {
        return url.replace('https://', 'wss://');
      } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        throw new ConfigurationValidationError(
          `WebSocket URL must start with ws:// or wss://`,
          fieldName
        );
      }

      const normalizedUrl = new URL(url);
      return normalizedUrl.origin;
    } catch {
      throw new ConfigurationValidationError(
        `Invalid WebSocket URL format: ${url}`,
        fieldName
      );
    }
  }

  /**
   * Validates a port number
   */
  static validatePort(port: number | string, fieldName: string): number {
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new ConfigurationValidationError(
        `Port must be between 1 and 65535, got: ${port}`,
        fieldName
      );
    }

    return portNum;
  }

  /**
   * Validates a hostname
   */
  static validateHostname(hostname: string, fieldName: string): string {
    if (!hostname || typeof hostname !== 'string') {
      throw new ConfigurationValidationError(
        `Hostname is required and must be a string`,
        fieldName
      );
    }

    const trimmed = hostname.trim();
    if (!trimmed) {
      throw new ConfigurationValidationError(
        `Hostname cannot be empty`,
        fieldName
      );
    }

    // Basic hostname validation (allows localhost, IP addresses, and domain names)
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostnameRegex.test(trimmed)) {
      throw new ConfigurationValidationError(
        `Invalid hostname format: ${trimmed}`,
        fieldName
      );
    }

    return trimmed;
  }

  /**
   * Builds environment-aware URLs dynamically
   */
  static buildEnvironmentUrls(): EnvironmentUrls {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';

    // Get configuration from environment with secure defaults
    const apiPort = this.validatePort(
      process.env.API_PORT || this.DEFAULT_PORTS.api,
      'API_PORT'
    );
    const webPort = this.validatePort(
      process.env.WEB_PORT || process.env.PORT || this.DEFAULT_PORTS.web,
      'WEB_PORT'
    );
    const apiHost = this.validateHostname(
      process.env.API_HOST || this.DEFAULT_HOSTS.apiHost,
      'API_HOST'
    );
    const webHost = this.validateHostname(
      process.env.WEB_HOST || this.DEFAULT_HOSTS.webHost,
      'WEB_HOST'
    );

    // Build base URLs dynamically
    const apiBaseUrl = this.validateUrl(
      process.env.PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        `http://${apiHost}:${apiPort}`,
      'API_BASE_URL'
    );

    const webBaseUrl = this.validateUrl(
      process.env.WEB_BASE_URL ||
        process.env.SITE_URL ||
        `http://${webHost}:${webPort}`,
      'WEB_BASE_URL'
    );

    const frontendUrl = this.validateUrl(
      process.env.FRONTEND_URL || webBaseUrl,
      'FRONTEND_URL'
    );

    const websocketUrl = this.validateWebSocketUrl(
      process.env.WS_URL ||
        process.env.WEBSOCKET_URL ||
        `${apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://')}`,
      'WS_URL'
    );

    // Build CORS origins dynamically
    const corsOrigins = this.buildCorsOrigins(
      apiBaseUrl,
      webBaseUrl,
      isProduction
    );

    return {
      apiBaseUrl,
      webBaseUrl,
      frontendUrl,
      websocketUrl,
      corsOrigins,
    };
  }

  /**
   * Builds CORS origins based on environment
   */
  private static buildCorsOrigins(
    apiBaseUrl: string,
    webBaseUrl: string,
    isProduction: boolean
  ): string[] {
    // In production, use explicitly configured origins
    if (isProduction) {
      const corsOrigin = process.env.CORS_ORIGIN;
      if (corsOrigin) {
        return corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0)
          .map((origin) => this.validateUrl(origin, 'CORS_ORIGIN'));
      }

      // Default production origins
      const productionDomain = process.env.PRODUCTION_DOMAIN;
      if (productionDomain) {
        const baseUrl = `https://${productionDomain}`;
        return [baseUrl, `www.${baseUrl}`];
      }

      return [webBaseUrl]; // Fallback to web base URL
    }

    // In development/test, include localhost variants
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin) {
      return corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .map((origin) => this.validateUrl(origin, 'CORS_ORIGIN'));
    }

    // Default development origins
    const devOrigins = [
      webBaseUrl,
      apiBaseUrl,
      'http://127.0.0.1:4321',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ];

    // Deduplicate and return
    return Array.from(new Set(devOrigins));
  }

  /**
   * Get port configuration
   */
  static getPortConfiguration(): PortConfiguration {
    return {
      api: this.validatePort(
        process.env.API_PORT || this.DEFAULT_PORTS.api,
        'API_PORT'
      ),
      web: this.validatePort(
        process.env.WEB_PORT || process.env.PORT || this.DEFAULT_PORTS.web,
        'WEB_PORT'
      ),
      database: this.validatePort(
        process.env.DATABASE_PORT || this.DEFAULT_PORTS.database,
        'DATABASE_PORT'
      ),
      redis: this.validatePort(
        process.env.REDIS_PORT || this.DEFAULT_PORTS.redis,
        'REDIS_PORT'
      ),
      minio: this.validatePort(
        process.env.MINIO_PORT || this.DEFAULT_PORTS.minio,
        'MINIO_PORT'
      ),
    };
  }

  /**
   * Get host configuration
   */
  static getHostConfiguration(): HostConfiguration {
    return {
      apiHost: this.validateHostname(
        process.env.API_HOST || this.DEFAULT_HOSTS.apiHost,
        'API_HOST'
      ),
      webHost: this.validateHostname(
        process.env.WEB_HOST || this.DEFAULT_HOSTS.webHost,
        'WEB_HOST'
      ),
      databaseHost: this.validateHostname(
        process.env.DATABASE_HOST || this.DEFAULT_HOSTS.databaseHost,
        'DATABASE_HOST'
      ),
      redisHost: this.validateHostname(
        process.env.REDIS_HOST || this.DEFAULT_HOSTS.redisHost,
        'REDIS_HOST'
      ),
      minioHost: this.validateHostname(
        process.env.MINIO_HOST || this.DEFAULT_HOSTS.minioHost,
        'MINIO_HOST'
      ),
    };
  }

  /**
   * Validate entire configuration
   */
  static validateConfiguration(): {
    isValid: boolean;
    errors: ConfigurationValidationError[];
    urls: EnvironmentUrls;
    ports: PortConfiguration;
    hosts: HostConfiguration;
  } {
    const errors: ConfigurationValidationError[] = [];
    let urls: EnvironmentUrls | null = null;
    let ports: PortConfiguration | null = null;
    let hosts: HostConfiguration | null = null;

    // Validate URLs
    try {
      urls = this.buildEnvironmentUrls();
    } catch (error) {
      if (error instanceof ConfigurationValidationError) {
        errors.push(error);
      } else {
        errors.push(
          new ConfigurationValidationError(
            `Failed to build environment URLs: ${error instanceof Error ? error.message : String(error)}`,
            'URLS'
          )
        );
      }
    }

    // Validate ports
    try {
      ports = this.getPortConfiguration();
    } catch (error) {
      if (error instanceof ConfigurationValidationError) {
        errors.push(error);
      } else {
        errors.push(
          new ConfigurationValidationError(
            `Failed to validate port configuration: ${error instanceof Error ? error.message : String(error)}`,
            'PORTS'
          )
        );
      }
    }

    // Validate hosts
    try {
      hosts = this.getHostConfiguration();
    } catch (error) {
      if (error instanceof ConfigurationValidationError) {
        errors.push(error);
      } else {
        errors.push(
          new ConfigurationValidationError(
            `Failed to validate host configuration: ${error instanceof Error ? error.message : String(error)}`,
            'HOSTS'
          )
        );
      }
    }

    return {
      isValid:
        errors.length === 0 &&
        urls !== null &&
        ports !== null &&
        hosts !== null,
      errors,
      urls: urls || ({} as EnvironmentUrls),
      ports: ports || ({} as PortConfiguration),
      hosts: hosts || ({} as HostConfiguration),
    };
  }
}
