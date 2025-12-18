/**
 * Service Port Configuration
 * Centralized port management for all services in the monorepo
 */

interface ServicePorts {
  // Application Services
  web: number; // Astro web app
  api: number; // NestJS API

  // Database Services
  postgres: number; // PostgreSQL database
  redis: number; // Redis cache

  // File Storage
  minio: number; // S3-compatible storage

  // External Services
  smtp: number; // SMTP email service

  // Development Services
  adminer: number; // Database admin tool
  redisCommander: number; // Redis admin tool
}

interface ServiceUrls {
  web: string;
  api: string;
  database: string;
  redis: string;
  minio: string;
}

interface DockerServiceConfig {
  name: string;
  port: number;
  hostPort?: number;
  healthCheck?: string;
  dependencies?: string[];
}

export class ServicePortService {
  private static instance: ServicePortService;
  private readonly ports: ServicePorts;
  private readonly urls: ServiceUrls;
  private readonly dockerServices: DockerServiceConfig[];

  private constructor() {
    this.ports = this.buildPortConfiguration();
    this.urls = this.buildUrlConfiguration();
    this.dockerServices = this.buildDockerConfiguration();
  }

  public static getInstance(): ServicePortService {
    if (!ServicePortService.instance) {
      ServicePortService.instance = new ServicePortService();
    }
    return ServicePortService.instance;
  }

  private buildPortConfiguration(): ServicePorts {
    return {
      web: this.getEnvNumber('WEB_PORT', 4321),
      api: this.getEnvNumber('API_PORT', 3000),
      postgres: this.getEnvNumber('DATABASE_PORT', 5432),
      redis: this.getEnvNumber('REDIS_PORT', 6379),
      minio: this.getEnvNumber('MINIO_PORT', 9000),
      smtp: this.getEnvNumber('SMTP_PORT', 587),
      adminer: this.getEnvNumber('ADMINER_PORT', 8080),
      redisCommander: this.getEnvNumber('REDIS_COMMANDER_PORT', 8081),
    };
  }

  private buildUrlConfiguration(): ServiceUrls {
    const protocol = this.getEnvString('PROTOCOL', 'http');
    const host = this.getEnvString('HOST', 'localhost');

    return {
      web: `${protocol}://${host}:${this.ports.web}`,
      api: `${protocol}://${host}:${this.ports.api}`,
      database: `${protocol}://${host}:${this.ports.postgres}`,
      redis: `${protocol}://${host}:${this.ports.redis}`,
      minio: `${protocol}://${host}:${this.ports.minio}`,
    };
  }

  private buildDockerConfiguration(): DockerServiceConfig[] {
    return [
      {
        name: 'postgres',
        port: this.ports.postgres,
        hostPort: this.ports.postgres,
        healthCheck: 'pg_isready -U postgres',
        dependencies: [],
      },
      {
        name: 'redis',
        port: this.ports.redis,
        hostPort: this.ports.redis,
        dependencies: [],
      },
      {
        name: 'minio',
        port: this.ports.minio,
        hostPort: this.ports.minio,
        dependencies: [],
      },
      {
        name: 'api',
        port: this.ports.api,
        hostPort: this.ports.api,
        dependencies: ['postgres', 'redis'],
      },
      {
        name: 'web',
        port: this.ports.web,
        hostPort: this.ports.web,
        dependencies: ['api'],
      },
      {
        name: 'adminer',
        port: this.ports.adminer,
        hostPort: this.ports.adminer,
        dependencies: ['postgres'],
      },
      {
        name: 'redis-commander',
        port: this.ports.redisCommander,
        hostPort: this.ports.redisCommander,
        dependencies: ['redis'],
      },
    ];
  }

  // Environment variable helpers
  private getEnvString(key: string, fallback: string): string {
    return process.env[key] || fallback;
  }

  private getEnvNumber(key: string, fallback: number): number {
    const value = process.env[key];
    if (!value) return fallback;

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(
        `Environment variable ${key} must be a valid number, got "${value}"`
      );
    }
    return num;
  }

  // Public getters
  public get servicePorts(): ServicePorts {
    return { ...this.ports };
  }

  public get serviceUrls(): ServiceUrls {
    return { ...this.urls };
  }

  public get dockerConfig(): DockerServiceConfig[] {
    return [...this.dockerServices];
  }

  // Utility methods
  public getPort(serviceName: keyof ServicePorts): number {
    return this.ports[serviceName];
  }

  public getUrl(serviceName: keyof ServiceUrls): string {
    return this.urls[serviceName];
  }

  public getDockerService(
    serviceName: string
  ): DockerServiceConfig | undefined {
    return this.dockerServices.find((service) => service.name === serviceName);
  }

  public getServiceDependencies(serviceName: string): string[] {
    const service = this.getDockerService(serviceName);
    return service?.dependencies ?? [];
  }

  // Validation methods
  public validatePortConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const usedPorts = new Set<number>();

    // Check for port conflicts
    Object.values(this.ports).forEach((port) => {
      if (usedPorts.has(port)) {
        errors.push(`Port conflict: ${port} is used by multiple services`);
      }
      usedPorts.add(port);

      // Check valid port range
      if (port < 1 || port > 65535) {
        errors.push(
          `Invalid port number: ${port} (must be between 1 and 65535)`
        );
      }

      // Check for privileged ports (1-1023) - generally avoid in development
      if (port < 1024 && process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Using privileged port ${port} in development`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public generateDockerComposeServices(): string {
    const services: string[] = [];

    this.dockerServices.forEach((service) => {
      const lines = [
        `  ${service.name}:`,
        `    image: ${this.getDockerImage(service.name)}`,
        `    ports:`,
        `      - "${service.hostPort || service.port}:${service.port}"`,
      ];

      if (service.dependencies && service.dependencies.length > 0) {
        lines.push(`    depends_on:`);
        service.dependencies.forEach((dep) => {
          lines.push(`      - ${dep}`);
        });
      }

      if (service.healthCheck) {
        lines.push(
          `    healthcheck:`,
          `      test: ["CMD", "${service.healthCheck}"]`,
          `      interval: 30s`,
          `      timeout: 10s`,
          `      retries: 3`
        );
      }

      // Add service-specific configuration
      lines.push(...this.getServiceSpecificConfig(service));

      services.push(lines.join('\n'));
    });

    return services.join('\n\n');
  }

  private getDockerImage(serviceName: string): string {
    const images: Record<string, string> = {
      postgres: 'postgres:15-alpine',
      redis: 'redis:7-alpine',
      minio: 'minio/minio:latest',
      api: 'node:20-alpine',
      web: 'node:20-alpine',
      adminer: 'adminer:latest',
      'redis-commander': 'rediscommander/redis-commander:latest',
    };

    return images[serviceName] || 'node:20-alpine';
  }

  private getServiceSpecificConfig(service: DockerServiceConfig): string[] {
    const configs: Record<string, string[]> = {
      postgres: [
        `    environment:`,
        `      POSTGRES_DB: jasaweb`,
        `      POSTGRES_USER: postgres`,
        `      POSTGRES_PASSWORD: password`,
        `    volumes:`,
        `      - postgres_data:/var/lib/postgresql/data`,
      ],
      redis: [`    volumes:`, `      - redis_data:/data`],
      minio: [
        `    command: server /data --console-address ":9001"`,
        `    environment:`,
        `      MINIO_ROOT_USER: minioadmin`,
        `      MINIO_ROOT_PASSWORD: minioadmin`,
        `    volumes:`,
        `      - minio_data:/data`,
      ],
      api: [
        `    build:`,
        `      context: .`,
        `      dockerfile: apps/api/Dockerfile`,
        `    environment:`,
        `      NODE_ENV: development`,
        `      DATABASE_URL: postgresql://postgres:password@postgres:5432/jasaweb`,
        `      REDIS_URL: redis://redis:6379`,
        `    volumes:`,
        `      - ./apps/api:/app`,
        `      - /app/node_modules`,
      ],
      web: [
        `    build:`,
        `      context: .`,
        `      dockerfile: apps/web/Dockerfile`,
        `    environment:`,
        `      PUBLIC_API_URL: http://api:3000`,
        `    volumes:`,
        `      - ./apps/web:/app`,
        `      - /app/node_modules`,
      ],
    };

    return configs[service.name] || [];
  }

  public getConfigSummary(): Record<string, any> {
    return {
      ports: this.ports,
      urls: this.urls,
      services: this.dockerServices.map((service) => ({
        name: service.name,
        port: service.port,
        dependencies: service.dependencies,
      })),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

// Export singleton instance and types
export const servicePorts = ServicePortService.getInstance();
export type { ServicePorts, ServiceUrls, DockerServiceConfig };
