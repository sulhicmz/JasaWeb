export interface SiteConfig {
    name: string;
    description: string;
    author: string;
    tagline: string;
    metaDescription: string;
    urls: {
        production: string;
        development: string;
        api: string;
        cdn: string;
    };
    social: {
        instagram: string;
        facebook: string;
        twitter: string;
        linkedin: string;
    };
}
export interface EmailConfig {
    contact: string;
    info: string;
    noreply: string;
    support: string;
    admin: string;
    fromName: string;
}
export interface SecurityConfig {
    maxFileUploadSize: number;
    allowedMimeTypes: string[];
    uploadPath: string;
    jwtSecretMinLength: number;
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    passwordMaxAge: number;
    passwordPreventReuse: number;
}
export interface NetworkConfig {
    ports: {
        api: number;
        web: number;
        database: number;
        redis: number;
        minio: number;
    };
    cors: {
        maxAge: number;
        allowedOrigins: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    csp: {
        fontSrc: string[];
        scriptSrc: string[];
        styleSrc: string[];
        imgSrc: string[];
    };
}
export interface CacheConfig {
    defaultTtl: number;
    dashboardTtl: number;
    projectTtl: number;
    sessionTtl: number;
}
export interface BusinessConfig {
    site: SiteConfig;
    emails: EmailConfig;
    security: SecurityConfig;
    network: NetworkConfig;
    cache: CacheConfig;
}
export declare const BUSINESS_CONFIG: BusinessConfig;
export declare const getSiteConfig: () => SiteConfig;
export declare const getEmailConfig: () => EmailConfig;
export declare const getSecurityConfig: () => SecurityConfig;
export declare const getNetworkConfig: () => NetworkConfig;
export declare const getCacheConfig: () => CacheConfig;
export declare const isEnvDevelopment: () => boolean;
export declare const isEnvTest: () => boolean;
export declare const isEnvProduction: () => boolean;
export default BUSINESS_CONFIG;
