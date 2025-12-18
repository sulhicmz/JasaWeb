export interface INetworkConfig {
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
export interface IDatabaseConfig {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    ssl: boolean;
}
export interface IEmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from: string;
    contact: string;
}
export interface ISecurityConfig {
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
export interface ICacheConfig {
    enabled: boolean;
    ttl: number;
    max: number;
    redis: {
        host: string;
        port: number;
        password?: string;
    };
}
export interface IFileUploadConfig {
    maxSize: number;
    allowedTypes: string[];
    storage: {
        type: 'local' | 's3';
        config: Record<string, string | number | boolean>;
    };
}
