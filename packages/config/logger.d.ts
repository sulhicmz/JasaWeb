declare class Logger {
    private static instance;
    private currentLevel;
    private isDevelopment;
    static getInstance(): Logger;
    private shouldLog;
    private formatMessage;
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error | Record<string, unknown>): void;
    private sendToLogService;
    performance(metric: string, value: number, details?: Record<string, unknown>): void;
    security(event: string, details?: Record<string, unknown>): void;
    audit(action: string, userId?: string, details?: Record<string, unknown>): void;
}
export declare const logger: Logger;
export default logger;
