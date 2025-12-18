"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JasaWebConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.jasaWebConfig = exports.JasaWebConfigService = exports.storageConfigRegistry = exports.StorageConfigRegistry = void 0;
const common_1 = require("@nestjs/common");
const env_validation_1 = require("./env-validation");
function getEnvArray(key, defaultValue = []) {
    const value = process.env[key];
    if (!value)
        return defaultValue;
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
class ConfigValidator {
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static isValidWebSocketUrl(url) {
        const wsRegex = /^(wss?):\/\/.+/;
        return wsRegex.test(url);
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static getEnvironmentType() {
        const nodeEnv = process?.env?.NODE_ENV;
        if (nodeEnv === 'production')
            return 'production';
        if (nodeEnv === 'test')
            return 'test';
        return 'development';
    }
    static validate(config) {
        const errors = [];
        const warnings = [];
        if (config.base?.SITE_URL && !this.isValidUrl(config.base.SITE_URL)) {
            errors.push(`Invalid SITE_URL: ${config.base.SITE_URL}`);
        }
        if (config.api?.PUBLIC_API_URL &&
            !this.isValidUrl(config.api.PUBLIC_API_URL)) {
            errors.push(`Invalid PUBLIC_API_URL: ${config.api.PUBLIC_API_URL}`);
        }
        if (config.api?.WEB_BASE_URL && !this.isValidUrl(config.api.WEB_BASE_URL)) {
            errors.push(`Invalid WEB_BASE_URL: ${config.api.WEB_BASE_URL}`);
        }
        if (config.api?.WS_ENABLED &&
            config.api?.WS_URL &&
            !this.isValidWebSocketUrl(config.api.WS_URL)) {
            errors.push(`Invalid WS_URL: ${config.api.WS_URL}`);
        }
        if (config.email?.CONTACT_EMAIL &&
            !this.isValidEmail(config.email.CONTACT_EMAIL)) {
            errors.push(`Invalid CONTACT_EMAIL: ${config.email.CONTACT_EMAIL}`);
        }
        const isProduction = this.getEnvironmentType() === 'production';
        if (isProduction) {
            const requiredSecrets = [
                'JWT_SECRET',
                'JWT_REFRESH_SECRET',
                'SESSION_SECRET',
                'ENCRYPTION_KEY',
            ];
            for (const secret of requiredSecrets) {
                const value = process.env[secret];
                if (!value || value.length < 32) {
                    errors.push(`Production requires ${secret} to be set (min 32 characters)`);
                }
            }
        }
        if (config.security?.BCRYPT_ROUNDS && config.security.BCRYPT_ROUNDS < 10) {
            warnings.push('BCRYPT_ROUNDS should be at least 10 for security');
        }
        if (config.api?.API_RATE_LIMIT_MAX &&
            config.api.API_RATE_LIMIT_MAX > 1000) {
            warnings.push('High API_RATE_LIMIT_MAX may impact performance');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
class StorageConfigRegistry {
    static instance;
    configurations = new Map();
    currentType = 'local';
    constructor() {
        this.initializeConfigurations();
        this.determineOptimalStorage();
    }
    static getInstance() {
        if (!StorageConfigRegistry.instance) {
            StorageConfigRegistry.instance = new StorageConfigRegistry();
        }
        return StorageConfigRegistry.instance;
    }
    initializeConfigurations() {
        const env = {
            getString: env_validation_1.getOptionalEnv,
            getNumber: env_validation_1.getEnvNumber,
            getBoolean: env_validation_1.getEnvBoolean,
        };
        this.configurations.set('local', {
            type: 'local',
            name: 'local',
            displayName: 'Local File System',
            description: 'Store files on the local file system',
            isAvailable: true,
            priority: 1,
            requiredEnvVars: [],
            optionalEnvVars: ['LOCAL_STORAGE_PATH'],
            validation: {
                maxFileSize: env.getNumber('MAX_FILE_SIZE', 10485760),
                allowedMimeTypes: this.parseAllowedTypes(env.getString('ALLOWED_FILE_TYPES', '')),
                bucketRequired: false,
                regionRequired: false,
                encryptionRequired: false,
            },
        });
        const s3Config = {
            type: 's3',
            name: 's3',
            displayName: 'Amazon S3',
            description: 'Store files in Amazon S3 cloud storage',
            isAvailable: this.validateS3Config(),
            priority: 3,
            requiredEnvVars: [
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'S3_BUCKET',
            ],
            optionalEnvVars: ['AWS_REGION', 'S3_REGION'],
            validation: {
                maxFileSize: 5 * 1024 * 1024 * 1024,
                allowedMimeTypes: this.parseAllowedTypes(env.getString('ALLOWED_FILE_TYPES', '')),
                bucketRequired: true,
                regionRequired: false,
                encryptionRequired: true,
            },
        };
        this.configurations.set('s3', s3Config);
        const minioConfig = {
            type: 'minio',
            name: 'minio',
            displayName: 'MinIO',
            description: 'Store files in MinIO S3-compatible storage',
            isAvailable: this.validateMinioConfig(),
            priority: 2,
            requiredEnvVars: ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'],
            optionalEnvVars: ['MINIO_ENDPOINT', 'MINIO_REGION'],
            validation: {
                maxFileSize: 2 * 1024 * 1024 * 1024,
                allowedMimeTypes: this.parseAllowedTypes(env.getString('ALLOWED_FILE_TYPES', '')),
                bucketRequired: true,
                regionRequired: false,
                encryptionRequired: false,
            },
        };
        this.configurations.set('minio', minioConfig);
    }
    validateS3Config() {
        return !!(process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.S3_BUCKET);
    }
    validateMinioConfig() {
        return !!(process.env.MINIO_ACCESS_KEY &&
            process.env.MINIO_SECRET_KEY &&
            process.env.MINIO_BUCKET);
    }
    parseAllowedTypes(typesString) {
        if (!typesString)
            return [];
        return typesString
            .split(',')
            .map((type) => type.trim())
            .filter(Boolean);
    }
    determineOptimalStorage() {
        const requestedType = process.env.STORAGE_TYPE;
        if (requestedType && this.configurations.has(requestedType)) {
            const config = this.configurations.get(requestedType);
            if (config.isAvailable) {
                this.currentType = requestedType;
                return;
            }
        }
        const availableConfigs = Array.from(this.configurations.values())
            .filter((c) => c.isAvailable)
            .sort((a, b) => b.priority - a.priority);
        if (availableConfigs.length > 0) {
            this.currentType = availableConfigs[0].type;
        }
    }
    getCurrentStorageType() {
        return this.currentType;
    }
    getStorageConfig(type) {
        return this.configurations.get(type);
    }
    getCurrentStorageConfig() {
        return this.configurations.get(this.currentType);
    }
    getAvailableStorageConfigs() {
        return Array.from(this.configurations.values())
            .filter((config) => config.isAvailable)
            .sort((a, b) => b.priority - a.priority);
    }
    validateCurrentStorage() {
        const config = this.getCurrentStorageConfig();
        if (!config) {
            return {
                isValid: false,
                errors: ['No storage configuration available'],
                warnings: ['Local storage will be used as fallback'],
            };
        }
        return {
            isValid: config.isAvailable,
            errors: [],
            warnings: [],
        };
    }
    getStorageSummary() {
        const currentConfig = this.getCurrentStorageConfig();
        const availableConfigs = this.getAvailableStorageConfigs();
        return {
            current: {
                type: this.currentType,
                name: currentConfig?.displayName || 'Unknown',
                available: currentConfig?.isAvailable || false,
            },
            available: availableConfigs.map((config) => ({
                type: config.type,
                name: config.displayName,
                priority: config.priority,
            })),
            total: this.configurations.size,
            validation: this.validateCurrentStorage(),
        };
    }
    autoSelectBestStorage() {
        const previousType = this.currentType;
        const previousConfig = this.configurations.get(previousType);
        if (previousConfig?.isAvailable) {
            return {
                previousType,
                newType: previousType,
                reason: 'Current storage is optimal',
            };
        }
        this.determineOptimalStorage();
        const newConfig = this.configurations.get(this.currentType);
        return {
            previousType,
            newType: this.currentType,
            reason: previousConfig?.isAvailable
                ? `Previous storage '${previousType}' became unavailable, switched to '${this.currentType}'`
                : `Selected best available storage: '${newConfig?.displayName}'`,
        };
    }
    switchStorageType(type) {
        const config = this.configurations.get(type);
        if (!config) {
            return {
                isValid: false,
                errors: [`Storage type '${type}' is not supported`],
                warnings: [],
            };
        }
        if (!config.isAvailable) {
            return {
                isValid: false,
                errors: [`Storage type '${type}' is not available`],
                warnings: [],
            };
        }
        this.currentType = type;
        return {
            isValid: true,
            errors: [],
            warnings: config.type === 'local'
                ? ['Using local storage - ensure proper backup strategy']
                : [],
        };
    }
}
exports.StorageConfigRegistry = StorageConfigRegistry;
exports.storageConfigRegistry = StorageConfigRegistry.getInstance();
let JasaWebConfigService = JasaWebConfigService_1 = class JasaWebConfigService {
    logger = new common_1.Logger(JasaWebConfigService_1.name);
    config;
    validation;
    env;
    constructor() {
        this.logger.log('Initializing JasaWeb unified configuration service');
        this.config = this.buildConfig();
        this.env = this.config.base.NODE_ENV;
        this.validation = ConfigValidator.validate(this.config);
        if (!this.validation.isValid) {
            this.logger.error('Configuration validation failed:', this.validation.errors);
            if (this.env !== 'test') {
                throw new Error(`Configuration validation failed: ${this.validation.errors.join(', ')}`);
            }
        }
        if (this.validation.warnings.length > 0) {
            this.logger.warn('Configuration warnings:', this.validation.warnings);
        }
        this.logger.log(`JasaWeb configuration loaded for ${this.env} environment`);
    }
    buildConfig() {
        return {
            base: {
                NODE_ENV: (0, env_validation_1.getOptionalEnv)('NODE_ENV', 'development'),
                PORT: (0, env_validation_1.getEnvNumber)('PORT', 4321),
                SITE_NAME: (0, env_validation_1.getOptionalEnv)('SITE_NAME', 'JasaWeb'),
                SITE_DESCRIPTION: (0, env_validation_1.getOptionalEnv)('SITE_DESCRIPTION', 'Professional Web Development Services'),
                SITE_AUTHOR: (0, env_validation_1.getOptionalEnv)('SITE_AUTHOR', 'JasaWeb Team'),
                SITE_URL: (0, env_validation_1.getOptionalEnv)('SITE_URL', 'http://localhost:4321'),
                APP_VERSION: (0, env_validation_1.getOptionalEnv)('APP_VERSION', '1.0.0'),
            },
            api: {
                API_PORT: (0, env_validation_1.getEnvNumber)('API_PORT', 3000),
                API_BASE_URL: (0, env_validation_1.getOptionalEnv)('API_BASE_URL', 'http://localhost:3000'),
                API_PREFIX: (0, env_validation_1.getOptionalEnv)('API_PREFIX', 'api'),
                PUBLIC_API_URL: (0, env_validation_1.getOptionalEnv)('PUBLIC_API_URL', 'http://localhost:3000'),
                WEB_BASE_URL: (0, env_validation_1.getOptionalEnv)('WEB_BASE_URL', 'http://localhost:4321'),
                FRONTEND_URL: (0, env_validation_1.getOptionalEnv)('FRONTEND_URL', 'http://localhost:4321'),
                API_TIMEOUT: (0, env_validation_1.getEnvNumber)('API_TIMEOUT', 30000),
                API_RETRIES: (0, env_validation_1.getEnvNumber)('API_RETRIES', 3),
                API_RETRY_DELAY: (0, env_validation_1.getEnvNumber)('API_RETRY_DELAY', 1000),
                WS_ENABLED: (0, env_validation_1.getEnvBoolean)('WS_ENABLED', true),
                WS_URL: (0, env_validation_1.getOptionalEnv)('WS_URL', 'ws://localhost:3000'),
                WS_RECONNECT_ATTEMPTS: (0, env_validation_1.getEnvNumber)('WS_RECONNECT_ATTEMPTS', 5),
                WS_RECONNECT_DELAY: (0, env_validation_1.getEnvNumber)('WS_RECONNECT_DELAY', 1000),
                WS_HEARTBEAT_INTERVAL: (0, env_validation_1.getEnvNumber)('WS_HEARTBEAT_INTERVAL', 30000),
                API_RATE_LIMIT_ENABLED: (0, env_validation_1.getEnvBoolean)('API_RATE_LIMIT_ENABLED', true),
                API_RATE_LIMIT_WINDOW: (0, env_validation_1.getEnvNumber)('API_RATE_LIMIT_WINDOW', 60000),
                API_RATE_LIMIT_MAX: (0, env_validation_1.getEnvNumber)('API_RATE_LIMIT_MAX', 100),
                API_RATE_LIMIT_SKIP_SUCCESS: (0, env_validation_1.getEnvBoolean)('API_RATE_LIMIT_SKIP_SUCCESS', false),
                API_RATE_LIMIT_SKIP_FAILED: (0, env_validation_1.getEnvBoolean)('API_RATE_LIMIT_SKIP_FAILED', true),
            },
            database: {
                POSTGRES_DB: (0, env_validation_1.getOptionalEnv)('POSTGRES_DB', 'jasaweb'),
                POSTGRES_USER: (0, env_validation_1.getOptionalEnv)('POSTGRES_USER', 'postgres'),
                POSTGRES_PASSWORD: (0, env_validation_1.getOptionalEnv)('POSTGRES_PASSWORD', ''),
                DATABASE_URL: (0, env_validation_1.getOptionalEnv)('DATABASE_URL', ''),
                DOCKER_DATABASE_URL: (0, env_validation_1.getOptionalEnv)('DOCKER_DATABASE_URL', ''),
            },
            security: {
                JWT_SECRET: (0, env_validation_1.getOptionalEnv)('JWT_SECRET', ''),
                JWT_EXPIRES_IN: (0, env_validation_1.getOptionalEnv)('JWT_EXPIRES_IN', '1d'),
                JWT_REFRESH_SECRET: (0, env_validation_1.getOptionalEnv)('JWT_REFRESH_SECRET', ''),
                JWT_REFRESH_EXPIRES_IN: (0, env_validation_1.getOptionalEnv)('JWT_REFRESH_EXPIRES_IN', '7d'),
                SESSION_SECRET: (0, env_validation_1.getOptionalEnv)('SESSION_SECRET', ''),
                SESSION_MAX_AGE: (0, env_validation_1.getEnvNumber)('SESSION_MAX_AGE', 86400000),
                ENCRYPTION_KEY: (0, env_validation_1.getOptionalEnv)('ENCRYPTION_KEY', ''),
                BCRYPT_ROUNDS: (0, env_validation_1.getEnvNumber)('BCRYPT_ROUNDS', 12),
                ARGON2_MEMORY: (0, env_validation_1.getEnvNumber)('ARGON2_MEMORY', 65536),
                ARGON2_ITERATIONS: (0, env_validation_1.getEnvNumber)('ARGON2_ITERATIONS', 3),
                ARGON2_PARALLELISM: (0, env_validation_1.getEnvNumber)('ARGON2_PARALLELISM', 1),
                ARGON2_SALT_LENGTH: (0, env_validation_1.getEnvNumber)('ARGON2_SALT_LENGTH', 32),
                ARGON2_HASH_LENGTH: (0, env_validation_1.getEnvNumber)('ARGON2_HASH_LENGTH', 32),
                RATE_LIMIT_TTL: (0, env_validation_1.getEnvNumber)('RATE_LIMIT_TTL', 60),
                RATE_LIMIT_MAX: (0, env_validation_1.getEnvNumber)('RATE_LIMIT_MAX', 100),
                THROTTLE_TTL: (0, env_validation_1.getEnvNumber)('THROTTLE_TTL', 60),
                THROTTLE_LIMIT: (0, env_validation_1.getEnvNumber)('THROTTLE_LIMIT', 10),
                MAX_LOGIN_ATTEMPTS: (0, env_validation_1.getEnvNumber)('MAX_LOGIN_ATTEMPTS', 5),
                LOCKOUT_DURATION: (0, env_validation_1.getEnvNumber)('LOCKOUT_DURATION', 900000),
                CORS_ORIGIN: (0, env_validation_1.getOptionalEnv)('CORS_ORIGIN', 'http://localhost:4321'),
            },
            storage: {
                STORAGE_TYPE: (0, env_validation_1.getOptionalEnv)('STORAGE_TYPE', 'local'),
                AWS_REGION: (0, env_validation_1.getOptionalEnv)('AWS_REGION', 'us-east-1'),
                AWS_ACCESS_KEY_ID: (0, env_validation_1.getOptionalEnv)('AWS_ACCESS_KEY_ID', ''),
                AWS_SECRET_ACCESS_KEY: (0, env_validation_1.getOptionalEnv)('AWS_SECRET_ACCESS_KEY', ''),
                S3_BUCKET: (0, env_validation_1.getOptionalEnv)('S3_BUCKET', 'jasaweb-storage'),
                S3_REGION: (0, env_validation_1.getOptionalEnv)('S3_REGION', 'us-east-1'),
                MINIO_ENDPOINT: (0, env_validation_1.getOptionalEnv)('MINIO_ENDPOINT', 'http://localhost:9000'),
                MINIO_ACCESS_KEY: (0, env_validation_1.getOptionalEnv)('MINIO_ACCESS_KEY', ''),
                MINIO_SECRET_KEY: (0, env_validation_1.getOptionalEnv)('MINIO_SECRET_KEY', ''),
                MINIO_BUCKET: (0, env_validation_1.getOptionalEnv)('MINIO_BUCKET', 'jasaweb-storage'),
                MINIO_ROOT_USER: (0, env_validation_1.getOptionalEnv)('MINIO_ROOT_USER', ''),
                MINIO_ROOT_PASSWORD: (0, env_validation_1.getOptionalEnv)('MINIO_ROOT_PASSWORD', ''),
                DOCKER_MINIO_ENDPOINT: (0, env_validation_1.getOptionalEnv)('DOCKER_MINIO_ENDPOINT', 'http://minio:9000'),
            },
            redis: {
                REDIS_HOST: (0, env_validation_1.getOptionalEnv)('REDIS_HOST', 'localhost'),
                REDIS_PORT: (0, env_validation_1.getEnvNumber)('REDIS_PORT', 6379),
                REDIS_PASSWORD: (0, env_validation_1.getOptionalEnv)('REDIS_PASSWORD', ''),
                DOCKER_REDIS_HOST: (0, env_validation_1.getOptionalEnv)('DOCKER_REDIS_HOST', 'redis'),
                DOCKER_REDIS_PORT: (0, env_validation_1.getEnvNumber)('DOCKER_REDIS_PORT', 6379),
            },
            email: {
                SMTP_HOST: (0, env_validation_1.getOptionalEnv)('SMTP_HOST', 'smtp.gmail.com'),
                SMTP_PORT: (0, env_validation_1.getEnvNumber)('SMTP_PORT', 587),
                SMTP_SECURE: (0, env_validation_1.getEnvBoolean)('SMTP_SECURE', false),
                SMTP_USER: (0, env_validation_1.getOptionalEnv)('SMTP_USER', ''),
                SMTP_PASS: (0, env_validation_1.getOptionalEnv)('SMTP_PASS', ''),
                EMAIL_FROM: (0, env_validation_1.getOptionalEnv)('EMAIL_FROM', '"JasaWeb" <noreply@jasaweb.com>'),
                CONTACT_EMAIL: (0, env_validation_1.getOptionalEnv)('CONTACT_EMAIL', 'contact@jasaweb.com'),
            },
            logging: {
                LOG_LEVEL: (0, env_validation_1.getOptionalEnv)('LOG_LEVEL', 'info'),
                LOG_FILE_PATH: (0, env_validation_1.getOptionalEnv)('LOG_FILE_PATH', './logs'),
                ENABLE_AUDIT_LOG: (0, env_validation_1.getEnvBoolean)('ENABLE_AUDIT_LOG', true),
                ENABLE_VERBOSE_LOGGING: (0, env_validation_1.getEnvBoolean)('ENABLE_VERBOSE_LOGGING', false),
                DEBUG: (0, env_validation_1.getEnvBoolean)('DEBUG', false),
            },
            cache: {
                ENABLE_CACHE: (0, env_validation_1.getEnvBoolean)('ENABLE_CACHE', true),
                CACHE_TTL: (0, env_validation_1.getEnvNumber)('CACHE_TTL', 3600),
                CACHE_MAX: (0, env_validation_1.getEnvNumber)('CACHE_MAX', 100),
            },
            fileUpload: {
                MAX_FILE_SIZE: (0, env_validation_1.getEnvNumber)('MAX_FILE_SIZE', 10485760),
                ALLOWED_FILE_TYPES: (0, env_validation_1.getOptionalEnv)('ALLOWED_FILE_TYPES', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx'),
            },
            development: {
                DEV_MODE: (0, env_validation_1.getEnvBoolean)('DEV_MODE', true),
                VERBOSE: (0, env_validation_1.getEnvBoolean)('VERBOSE', false),
                ENABLE_SWAGGER: (0, env_validation_1.getEnvBoolean)('ENABLE_SWAGGER', true),
                ENABLE_EMAIL_NOTIFICATIONS: (0, env_validation_1.getEnvBoolean)('ENABLE_EMAIL_NOTIFICATIONS', true),
                ENABLE_COVERAGE_REPORT: (0, env_validation_1.getEnvBoolean)('ENABLE_COVERAGE_REPORT', true),
                COVERAGE_THRESHOLD: (0, env_validation_1.getEnvNumber)('COVERAGE_THRESHOLD', 80),
            },
            analytics: {
                GOOGLE_ANALYTICS_ID: (0, env_validation_1.getOptionalEnv)('GOOGLE_ANALYTICS_ID', ''),
                GOOGLE_TAG_MANAGER_ID: (0, env_validation_1.getOptionalEnv)('GOOGLE_TAG_MANAGER_ID', ''),
                PUBLIC_GA_ID: (0, env_validation_1.getOptionalEnv)('PUBLIC_GA_ID', ''),
                PUBLIC_GTM_ID: (0, env_validation_1.getOptionalEnv)('PUBLIC_GTM_ID', ''),
            },
            seo: {
                META_TITLE: (0, env_validation_1.getOptionalEnv)('META_TITLE', 'JasaWeb - Professional Web Development Services'),
                META_DESCRIPTION: (0, env_validation_1.getOptionalEnv)('META_DESCRIPTION', 'Professional web development services for schools, news portals, and company profiles'),
                META_KEYWORDS: (0, env_validation_1.getOptionalEnv)('META_KEYWORDS', 'web development, website design, school website, news portal, company profile'),
                OG_IMAGE: (0, env_validation_1.getOptionalEnv)('OG_IMAGE', '/images/og-image.jpg'),
            },
            social: {
                FACEBOOK_URL: (0, env_validation_1.getOptionalEnv)('FACEBOOK_URL', ''),
                TWITTER_URL: (0, env_validation_1.getOptionalEnv)('TWITTER_URL', ''),
                INSTAGRAM_URL: (0, env_validation_1.getOptionalEnv)('INSTAGRAM_URL', ''),
                LINKEDIN_URL: (0, env_validation_1.getOptionalEnv)('LINKEDIN_URL', ''),
            },
            featureFlags: {
                ENABLE_AUTOMATION: (0, env_validation_1.getEnvBoolean)('ENABLE_AUTOMATION', true),
                ENABLE_SELF_HEALING: (0, env_validation_1.getEnvBoolean)('ENABLE_SELF_HEALING', true),
                ENABLE_AUTO_MERGE: (0, env_validation_1.getEnvBoolean)('ENABLE_AUTO_MERGE', true),
                ENABLE_BLOG: (0, env_validation_1.getEnvBoolean)('ENABLE_BLOG', true),
                ENABLE_PORTFOLIO: (0, env_validation_1.getEnvBoolean)('ENABLE_PORTFOLIO', true),
                ENABLE_CONTACT_FORM: (0, env_validation_1.getEnvBoolean)('ENABLE_CONTACT_FORM', true),
            },
            compliance: {
                GDPR_COMPLIANCE_ENABLED: (0, env_validation_1.getEnvBoolean)('GDPR_COMPLIANCE_ENABLED', true),
                CCPA_COMPLIANCE_ENABLED: (0, env_validation_1.getEnvBoolean)('CCPA_COMPLIANCE_ENABLED', true),
                WCAG_COMPLIANCE_LEVEL: (0, env_validation_1.getOptionalEnv)('WCAG_COMPLIANCE_LEVEL', 'AA'),
            },
            i18n: {
                DEFAULT_LOCALE: (0, env_validation_1.getOptionalEnv)('DEFAULT_LOCALE', 'en'),
                SUPPORTED_LOCALES: (0, env_validation_1.getOptionalEnv)('SUPPORTED_LOCALES', 'en,id,es,fr'),
            },
            mobile: {
                MOBILE_RESPONSIVE_ENABLED: (0, env_validation_1.getEnvBoolean)('MOBILE_RESPONSIVE_ENABLED', true),
            },
            opencode: {
                IFLOW_API_KEY: (0, env_validation_1.getOptionalEnv)('IFLOW_API_KEY', ''),
                IFLOW_MODEL: (0, env_validation_1.getOptionalEnv)('IFLOW_MODEL', 'iflowcn/qwen3-max'),
                OPENCODE_DEBUG: (0, env_validation_1.getEnvBoolean)('OPENCODE_DEBUG', false),
            },
            github: {
                GH_TOKEN: (0, env_validation_1.getOptionalEnv)('GH_TOKEN', ''),
            },
        };
    }
    getDatabaseConfig() {
        return {
            url: this.config.database.DATABASE_URL || this.buildDatabaseUrl(),
            host: this.extractHostFromUrl(this.config.database.DATABASE_URL) ||
                'localhost',
            port: this.extractPortFromUrl(this.config.database.DATABASE_URL) || 5432,
            name: this.config.database.POSTGRES_DB || 'jasaweb',
            user: this.config.database.POSTGRES_USER || 'postgres',
            ssl: this.isProduction(),
        };
    }
    getSection(section) {
        return this.config[section];
    }
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                throw new Error(`Configuration path '${path}' not found`);
            }
        }
        return value;
    }
    isDevelopment() {
        return this.env === 'development';
    }
    isProduction() {
        return this.env === 'production';
    }
    isTest() {
        return this.env === 'test';
    }
    getEnvironmentType() {
        return this.env;
    }
    getNetworkConfig() {
        return {
            api: {
                port: this.config.base.PORT,
                baseUrl: this.config.base.SITE_URL,
                prefix: this.config.api.API_PREFIX,
                publicUrl: this.config.api.PUBLIC_API_URL,
            },
            web: {
                port: this.config.base.PORT,
                baseUrl: this.config.base.SITE_URL,
            },
            cors: {
                origins: this.getDynamicCorsOrigins(),
                credentials: true,
            },
            websocket: {
                enabled: this.config.api.WS_ENABLED,
                url: this.config.api.WS_URL,
                origin: this.config.api.WEB_BASE_URL,
            },
        };
    }
    getDynamicCorsOrigins() {
        const corsOrigin = this.config.security.CORS_ORIGIN;
        if (corsOrigin) {
            return corsOrigin.split(',').map((origin) => origin.trim());
        }
        if (this.isDevelopment()) {
            return [
                `${this.config.base.SITE_URL}`,
                `${this.config.api.PUBLIC_API_URL}`,
                'http://localhost:4321',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:4321',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
            ];
        }
        return [
            this.config.base.SITE_URL,
            this.config.api.PUBLIC_API_URL,
            'https://jasaweb.com',
            'https://www.jasaweb.com',
            'https://api.jasaweb.com',
        ];
    }
    getDatabaseConfig() {
        return {
            url: this.config.database.DATABASE_URL || this.buildDatabaseUrl(),
            host: this.extractHostFromUrl(this.config.database.DATABASE_URL) ||
                'localhost',
            port: this.extractPortFromUrl(this.config.database.DATABASE_URL) || 5432,
            name: this.config.database.POSTGRES_DB,
            user: this.config.database.POSTGRES_USER,
            ssl: this.isProduction(),
        };
    }
    buildDatabaseUrl() {
        const host = this.config.database.DOCKER_DATABASE_URL
            ? this.extractHostFromUrl(this.config.database.DOCKER_DATABASE_URL)
            : 'localhost';
        const port = this.extractPortFromUrl(this.config.database.DATABASE_URL) || 5432;
        const user = this.config.database.POSTGRES_USER || 'postgres';
        const password = this.config.database.POSTGRES_PASSWORD || '';
        const database = this.config.database.POSTGRES_DB || 'jasaweb';
        return `postgresql://${user}:${password}@${host}:${port}/${database}`;
    }
    extractHostFromUrl(url) {
        if (!url)
            return null;
        try {
            return new URL(url).hostname;
        }
        catch {
            return null;
        }
    }
    extractPortFromUrl(url) {
        if (!url)
            return null;
        try {
            return new URL(url).port ? parseInt(new URL(url).port, 10) : null;
        }
        catch {
            return null;
        }
    }
    getEmailConfig() {
        return {
            host: this.config.email.SMTP_HOST || 'smtp.gmail.com',
            port: this.config.email.SMTP_PORT || 587,
            secure: this.config.email.SMTP_SECURE || false,
            user: this.config.email.SMTP_USER || undefined,
            pass: this.config.email.SMTP_PASS || undefined,
            from: this.config.email.EMAIL_FROM || '"JasaWeb" <noreply@jasaweb.com>',
            contact: this.config.email.CONTACT_EMAIL || 'contact@jasaweb.com',
        };
    }
    getSecurityConfig() {
        return {
            jwt: {
                secret: this.config.security.JWT_SECRET,
                expiresIn: this.config.security.JWT_EXPIRES_IN,
                refreshSecret: this.config.security.JWT_REFRESH_SECRET,
                refreshExpiresIn: this.config.security.JWT_REFRESH_EXPIRES_IN,
            },
            session: {
                secret: this.config.security.SESSION_SECRET,
                maxAge: this.config.security.SESSION_MAX_AGE,
            },
            encryption: {
                key: this.config.security.ENCRYPTION_KEY,
            },
            bcrypt: {
                rounds: this.config.security.BCRYPT_ROUNDS,
            },
            argon2: {
                memory: this.config.security.ARGON2_MEMORY,
                iterations: this.config.security.ARGON2_ITERATIONS,
                parallelism: this.config.security.ARGON2_PARALLELISM,
                saltLength: this.config.security.ARGON2_SALT_LENGTH,
                hashLength: this.config.security.ARGON2_HASH_LENGTH,
            },
            rateLimit: {
                ttl: this.config.security.RATE_LIMIT_TTL,
                max: this.config.security.RATE_LIMIT_MAX,
            },
            throttle: {
                ttl: this.config.security.THROTTLE_TTL,
                limit: this.config.security.THROTTLE_LIMIT,
            },
            maxLoginAttempts: this.config.security.MAX_LOGIN_ATTEMPTS,
            lockoutDuration: this.config.security.LOCKOUT_DURATION,
        };
    }
    getCacheConfig() {
        return {
            enabled: this.config.cache.ENABLE_CACHE,
            ttl: this.config.cache.CACHE_TTL,
            max: this.config.cache.CACHE_MAX,
            redis: {
                host: this.config.redis.REDIS_HOST,
                port: this.config.redis.REDIS_PORT,
                password: this.config.redis.REDIS_PASSWORD || undefined,
            },
        };
    }
    getFileUploadConfig() {
        return {
            maxSize: this.config.fileUpload.MAX_FILE_SIZE,
            allowedTypes: this.config.fileUpload.ALLOWED_FILE_TYPES.split(',').map((type) => type.trim()),
            storage: {
                type: this.config.storage.STORAGE_TYPE,
                config: {
                    ...(this.config.storage.STORAGE_TYPE === 's3' && {
                        region: this.config.storage.S3_REGION,
                        bucket: this.config.storage.S3_BUCKET,
                        accessKeyId: this.config.storage.AWS_ACCESS_KEY_ID,
                        secretAccessKey: this.config.storage.AWS_SECRET_ACCESS_KEY,
                    }),
                    ...(this.config.storage.STORAGE_TYPE === 'local' && {
                        endpoint: this.config.storage.MINIO_ENDPOINT,
                        bucket: this.config.storage.MINIO_BUCKET,
                        accessKey: this.config.storage.MINIO_ACCESS_KEY,
                        secretKey: this.config.storage.MINIO_SECRET_KEY,
                    }),
                },
            },
        };
    }
    getApiUrl(path = '') {
        const networkConfig = this.getNetworkConfig();
        const baseUrl = networkConfig.api.baseUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    }
    getWebUrl(path = '') {
        const networkConfig = this.getNetworkConfig();
        const baseUrl = networkConfig.web.baseUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    }
    isOriginAllowed(origin) {
        const networkConfig = this.getNetworkConfig();
        return networkConfig.cors.origins.includes(origin);
    }
    isHealthy() {
        try {
            return !!(this.config.base.SITE_NAME &&
                this.config.base.SITE_URL &&
                this.config.email.CONTACT_EMAIL &&
                this.validation.isValid);
        }
        catch (error) {
            this.logger.error('Configuration health check failed:', error);
            return false;
        }
    }
    getConfigSummary() {
        return this.getSummary({
            obscureSecrets: true,
        });
    }
    getSummary(options = {}) {
        const { obscureSecrets = true, sections = Object.keys(this.config), } = options;
        const summary = {};
        for (const section of sections) {
            if (section in this.config) {
                summary[section] = this.processSection(this.config[section], obscureSecrets);
            }
        }
        return {
            environment: this.env,
            isValid: this.validation.isValid,
            validation: {
                errors: this.validation.errors,
                warnings: this.validation.warnings,
            },
            config: summary,
        };
    }
    processSection(section, obscureSecrets) {
        if (typeof section !== 'object' || section === null) {
            return section;
        }
        const processed = {};
        const secretKeys = [
            'SECRET',
            'PASSWORD',
            'KEY',
            'TOKEN',
            'PASS',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'SESSION_SECRET',
            'ENCRYPTION_KEY',
            'AWS_SECRET_ACCESS_KEY',
            'MINIO_SECRET_KEY',
            'MINIO_ROOT_PASSWORD',
            'REDIS_PASSWORD',
            'GH_TOKEN',
            'IFLOW_API_KEY',
        ];
        for (const [key, value] of Object.entries(section)) {
            if (obscureSecrets &&
                secretKeys.some((secret) => key.toUpperCase().includes(secret))) {
                processed[key] = this.obscureValue(value);
            }
            else if (typeof value === 'string' && value.length > 100) {
                processed[key] = value.substring(0, 100) + '...';
            }
            else {
                processed[key] = value;
            }
        }
        return processed;
    }
    obscureValue(value) {
        if (!value)
            return '[EMPTY]';
        const str = String(value);
        if (str.length <= 8) {
            return '[***]';
        }
        return str.substring(0, 4) + '[***]' + str.substring(str.length - 4);
    }
    getValidation() {
        return this.validation;
    }
    logConfiguration() {
        const networkConfig = this.getNetworkConfig();
        const databaseConfig = this.getDatabaseConfig();
        const emailConfig = this.getEmailConfig();
        this.logger.debug('JasaWeb configuration loaded', {
            environment: this.env,
            network: {
                api: `${networkConfig.api.baseUrl}:${networkConfig.api.port}`,
                web: `${networkConfig.web.baseUrl}:${networkConfig.web.port}`,
                corsOrigins: networkConfig.cors.origins,
                websocket: {
                    enabled: networkConfig.websocket.enabled,
                    url: networkConfig.websocket.url,
                },
            },
            database: {
                host: databaseConfig.host,
                port: databaseConfig.port,
                name: databaseConfig.name,
                ssl: databaseConfig.ssl,
            },
            email: {
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                from: emailConfig.from,
                contact: emailConfig.contact,
            },
        });
    }
};
exports.JasaWebConfigService = JasaWebConfigService;
exports.JasaWebConfigService = JasaWebConfigService = JasaWebConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JasaWebConfigService);
exports.jasaWebConfig = new JasaWebConfigService();
//# sourceMappingURL=jasaweb-config.service.js.map