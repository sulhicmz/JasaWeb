interface ServicePorts {
    web: number;
    api: number;
    postgres: number;
    redis: number;
    minio: number;
    smtp: number;
    adminer: number;
    redisCommander: number;
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
export declare class ServicePortService {
    private static instance;
    private readonly ports;
    private readonly urls;
    private readonly dockerServices;
    private constructor();
    static getInstance(): ServicePortService;
    private buildPortConfiguration;
    private buildUrlConfiguration;
    private buildDockerConfiguration;
    private getEnvString;
    private getEnvNumber;
    get servicePorts(): ServicePorts;
    get serviceUrls(): ServiceUrls;
    get dockerConfig(): DockerServiceConfig[];
    getPort(serviceName: keyof ServicePorts): number;
    getUrl(serviceName: keyof ServiceUrls): string;
    getDockerService(serviceName: string): DockerServiceConfig | undefined;
    getServiceDependencies(serviceName: string): string[];
    validatePortConfiguration(): {
        isValid: boolean;
        errors: string[];
    };
    generateDockerComposeServices(): string;
    private getDockerImage;
    private getServiceSpecificConfig;
    getConfigSummary(): Record<string, unknown>;
}
export declare const servicePorts: ServicePortService;
export type { ServicePorts, ServiceUrls, DockerServiceConfig };
