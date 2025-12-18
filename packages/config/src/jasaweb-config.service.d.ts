export type { INetworkConfig, IDatabaseConfig, IEmailConfig, ISecurityConfig, ICacheConfig, IFileUploadConfig, } from './jasaweb-config.types';
export type EnvironmentType = 'development' | 'production' | 'test';
export type ConfigSection = 'base' | 'api' | 'database' | 'security' | 'storage' | 'redis' | 'email' | 'logging' | 'cache' | 'fileUpload' | 'development' | 'analytics' | 'seo' | 'social' | 'featureFlags' | 'compliance' | 'i18n' | 'mobile' | 'opencode' | 'github';
export interface JasaWebConfig {
    base: {
        NODE_ENV: EnvironmentType;
        PORT: number;
        SITE_NAME: string;
        SITE_DESCRIPTION: string;
        SITE_AUTHOR: string;
        SITE_URL: string;
        APP_VERSION: string;
    };
    api: {
        API_PORT: number;
        API_BASE_URL: string;
        API_PREFIX: string;
        PUBLIC_API_URL: string;
        WEB_BASE_URL: string;
        FRONTEND_URL: string;
        API_TIMEOUT: number;
        API_RETRIES: number;
        API_RETRY_DELAY: number;
        WS_ENABLED: boolean;
        WS_URL: string;
        WS_RECONNECT_ATTEMPTS: number;
        WS_RECONNECT_DELAY: number;
        WS_HEARTBEAT_INTERVAL: number;
        API_RATE_LIMIT_ENABLED: boolean;
        API_RATE_LIMIT_WINDOW: number;
        API_RATE_LIMIT_MAX: number;
        API_RATE_LIMIT_SKIP_SUCCESS: boolean;
        API_RATE_LIMIT_SKIP_FAILED: boolean;
    };
    database: {
        POSTGRES_DB: string;
        POSTGRES_USER: string;
        POSTGRES_PASSWORD: string;
        DATABASE_URL: string;
        DOCKER_DATABASE_URL: string;
    };
    security: {
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;
        JWT_REFRESH_SECRET: string;
        JWT_REFRESH_EXPIRES_IN: string;
        SESSION_SECRET: string;
        SESSION_MAX_AGE: number;
        ENCRYPTION_KEY: string;
        BCRYPT_ROUNDS: number;
        ARGON2_MEMORY: number;
        ARGON2_ITERATIONS: number;
        ARGON2_PARALLELISM: number;
        ARGON2_SALT_LENGTH: number;
        ARGON2_HASH_LENGTH: number;
        RATE_LIMIT_TTL: number;
        RATE_LIMIT_MAX: number;
        THROTTLE_TTL: number;
        THROTTLE_LIMIT: number;
        MAX_LOGIN_ATTEMPTS: number;
        LOCKOUT_DURATION: number;
        CORS_ORIGIN: string;
    };
    storage: {
        STORAGE_TYPE: 'local' | 's3';
        AWS_REGION: string;
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        S3_BUCKET: string;
        S3_REGION: string;
        MINIO_ENDPOINT: string;
        MINIO_ACCESS_KEY: string;
        MINIO_SECRET_KEY: string;
        MINIO_BUCKET: string;
        MINIO_ROOT_USER: string;
        MINIO_ROOT_PASSWORD: string;
        DOCKER_MINIO_ENDPOINT: string;
    };
    redis: {
        REDIS_HOST: string;
        REDIS_PORT: number;
        REDIS_PASSWORD: string;
        DOCKER_REDIS_HOST: string;
        DOCKER_REDIS_PORT: number;
    };
    email: {
        SMTP_HOST: string;
        SMTP_PORT: number;
        SMTP_SECURE: boolean;
        SMTP_USER: string;
        SMTP_PASS: string;
        EMAIL_FROM: string;
        CONTACT_EMAIL: string;
    };
    logging: {
        LOG_LEVEL: string;
        LOG_FILE_PATH: string;
        ENABLE_AUDIT_LOG: boolean;
        ENABLE_VERBOSE_LOGGING: boolean;
        DEBUG: boolean;
    };
    cache: {
        ENABLE_CACHE: boolean;
        CACHE_TTL: number;
        CACHE_MAX: number;
    };
    fileUpload: {
        MAX_FILE_SIZE: number;
        ALLOWED_FILE_TYPES: string;
    };
    development: {
        DEV_MODE: boolean;
        VERBOSE: boolean;
        ENABLE_SWAGGER: boolean;
        ENABLE_EMAIL_NOTIFICATIONS: boolean;
        ENABLE_COVERAGE_REPORT: boolean;
        COVERAGE_THRESHOLD: number;
    };
    analytics: {
        GOOGLE_ANALYTICS_ID: string;
        GOOGLE_TAG_MANAGER_ID: string;
        PUBLIC_GA_ID: string;
        PUBLIC_GTM_ID: string;
    };
    seo: {
        META_TITLE: string;
        META_DESCRIPTION: string;
        META_KEYWORDS: string;
        OG_IMAGE: string;
    };
    social: {
        FACEBOOK_URL: string;
        TWITTER_URL: string;
        INSTAGRAM_URL: string;
        LINKEDIN_URL: string;
    };
    featureFlags: {
        ENABLE_AUTOMATION: boolean;
        ENABLE_SELF_HEALING: boolean;
        ENABLE_AUTO_MERGE: boolean;
        ENABLE_BLOG: boolean;
        ENABLE_PORTFOLIO: boolean;
        ENABLE_CONTACT_FORM: boolean;
    };
    compliance: {
        GDPR_COMPLIANCE_ENABLED: boolean;
        CCPA_COMPLIANCE_ENABLED: boolean;
        WCAG_COMPLIANCE_LEVEL: string;
    };
    i18n: {
        DEFAULT_LOCALE: string;
        SUPPORTED_LOCALES: string;
    };
    mobile: {
        MOBILE_RESPONSIVE_ENABLED: boolean;
    };
    opencode: {
        IFLOW_API_KEY: string;
        IFLOW_MODEL: string;
        OPENCODE_DEBUG: boolean;
    };
    github: {
        GH_TOKEN: string;
    };
}
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface NetworkConfig {
    api: {
        port: number;
        baseUrl: string;
        prefix: string;
        publicUrl: string;
    };
    web: {
        port: number;
        baseUrl: string;
    };
    cors: {
        origins: string[];
        credentials: boolean;
    };
    websocket: {
        enabled: boolean;
        url: string;
        origin: string;
    };
}
export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    ssl: boolean;
}
export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from: string;
    contact: string;
}
export interface SecurityConfig {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    session: {
        secret: string;
        maxAge: number;
    };
    encryption: {
        key: string;
    };
    bcrypt: {
        rounds: number;
    };
    argon2: {
        memory: number;
        iterations: number;
        parallelism: number;
        saltLength: number;
        hashLength: number;
    };
    rateLimit: {
        ttl: number;
        max: number;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    maxLoginAttempts: number;
    lockoutDuration: number;
}
export interface CacheConfig {
    enabled: boolean;
    ttl: number;
    max: number;
    redis: {
        host: string;
        port: number;
        password?: string;
    };
}
export interface FileUploadConfig {
    maxSize: number;
    allowedTypes: string[];
    storage: {
        type: 'local' | 's3';
        config: Record<string, string | number | boolean>;
    };
}
export type StorageType = 'local' | 's3' | 'minio' | 'gcs' | 'azure';
export interface StorageConfig {
    type: StorageType;
    name: string;
    displayName: string;
    description: string;
    isAvailable: boolean;
    priority: number;
    requiredEnvVars: string[];
    optionalEnvVars: string[];
    validation: StorageValidation;
}
export interface StorageValidation {
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    bucketRequired?: boolean;
    regionRequired?: boolean;
    encryptionRequired?: boolean;
    customValidation?: (config: JasaWebConfig) => ValidationResult;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class StorageConfigRegistry {
    private static instance;
    private configurations;
    private currentType;
    private constructor();
    static getInstance(): StorageConfigRegistry;
    private initializeConfigurations;
    private validateS3Config;
    private validateMinioConfig;
    private parseAllowedTypes;
    private determineOptimalStorage;
    getCurrentStorageType(): StorageType;
    getStorageConfig(type: StorageType): StorageConfig | undefined;
    getCurrentStorageConfig(): StorageConfig | undefined;
    getAvailableStorageConfigs(): StorageConfig[];
    validateCurrentStorage(): ValidationResult;
    getStorageSummary(): Record<string, unknown>;
    autoSelectBestStorage(): {
        previousType: StorageType;
        newType: StorageType;
        reason: string;
    };
    switchStorageType(type: StorageType): ValidationResult;
}
export declare const storageConfigRegistry: StorageConfigRegistry;
export declare class JasaWebConfigService {
    private readonly logger;
    private readonly config;
    private readonly validation;
    private readonly env;
    constructor();
    private buildConfig;
    getSection<T extends ConfigSection>(section: T): JasaWebConfig[T];
    get<T = unknown>(path: string): T;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
    getEnvironmentType(): EnvironmentType;
    getNetworkConfig(): NetworkConfig;
    private getDynamicCorsOrigins;
    getDatabaseConfig(): DatabaseConfig;
    private buildDatabaseUrl;
    private extractHostFromUrl;
    private extractPortFromUrl;
    getEmailConfig(): EmailConfig;
    getSecurityConfig(): SecurityConfig;
    getCacheConfig(): CacheConfig;
    getFileUploadConfig(): FileUploadConfig;
    getApiUrl(path?: string): string;
    getWebUrl(path?: string): string;
    isOriginAllowed(origin: string): boolean;
    isHealthy(): boolean;
    getConfigSummary(): Record<string, unknown>;
    getSummary(options?: {
        obscureSecrets?: boolean;
        sections?: ConfigSection[];
    }): Record<string, unknown>;
    private processSection;
    private obscureValue;
    getValidation(): ConfigValidationResult;
    logConfiguration(): void;
}
export declare const jasaWebConfig: JasaWebConfigService;
