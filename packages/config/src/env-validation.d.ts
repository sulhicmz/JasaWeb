export declare function getRequiredEnv(key: string): string;
export declare function getOptionalEnv(key: string, defaultValue?: string): string | undefined;
export declare function getEnvNumber(key: string, defaultValue: number): number;
export declare function getEnvBoolean(key: string, defaultValue: boolean): boolean;
export declare function generateSecureSecret(length?: number): string;
