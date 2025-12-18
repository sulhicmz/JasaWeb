export interface EnvSchema {
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    minLength?: number;
    pattern?: RegExp;
    description?: string;
    defaultValue?: string | number | boolean;
}
export declare const ENV_SCHEMA: Record<string, EnvSchema>;
export declare class EnvValidationError extends Error {
    constructor(message: string);
}
export declare function validateEnvironmentVariables(): void;
export declare function getRequiredEnv(key: string): string;
export declare function getOptionalEnv(key: string, defaultValue?: string): string | undefined;
export declare function getEnvNumber(key: string, defaultValue?: number): number;
export declare function getEnvBoolean(key: string, defaultValue?: boolean): boolean;
export declare function generateSecureSecret(length?: number): string;
