/**
 * Resilience Utilities
 * 
 * Provides retry logic with exponential backoff, timeout handling, 
 * and circuit breaker pattern for external service calls.
 * 
 * Key Patterns:
 * - Retry with exponential backoff for transient failures
 * - Timeout handling to prevent hanging requests
 * - Circuit breaker to stop calling failing services
 * - Fallback mechanisms for degraded functionality
 */

// ==============================================
// ERROR CODES
// ==============================================

/**
 * Standardized error codes for external service failures
 */
export enum ExternalServiceErrorCode {
    TIMEOUT = 'EXTERNAL_TIMEOUT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    RATE_LIMITED = 'RATE_LIMITED',
    INVALID_RESPONSE = 'INVALID_RESPONSE',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
    MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
    UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Standardized external service error
 */
export class ExternalServiceError extends Error {
    constructor(
        message: string,
        public code: ExternalServiceErrorCode,
        public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        public originalError?: unknown,
        public retryable: boolean = true
    ) {
        super(message);
        this.name = 'ExternalServiceError';
    }
}

// ==============================================
// RETRY WITH EXPONENTIAL BACKOFF
// ==============================================

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: ExternalServiceErrorCode[];
    jitter: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
        ExternalServiceErrorCode.TIMEOUT,
        ExternalServiceErrorCode.NETWORK_ERROR,
        ExternalServiceErrorCode.SERVICE_UNAVAILABLE,
        ExternalServiceErrorCode.RATE_LIMITED,
    ],
    jitter: true,
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @param context - Context for logging
 * @returns Result of the function or throws after max retries
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: string
): Promise<T> {
    const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | ExternalServiceError | null = null;

    for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
        try {
            const result = await fn();
            
            if (attempt > 0) {
                const logContext = context || 'retry-operation';
                console.info(`[Resilience] ${logContext} succeeded on attempt ${attempt + 1}`);
            }
            
            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const isExternalServiceError = error instanceof ExternalServiceError;
            const errorCode = isExternalServiceError ? error.code : ExternalServiceErrorCode.UNKNOWN;
            const isRetryable = isExternalServiceError 
                ? error.retryable && fullConfig.retryableErrors.includes(errorCode)
                : true;

            if (attempt === fullConfig.maxRetries || !isRetryable) {
                const logContext = context || 'retry-operation';
                console.error(`[Resilience] ${logContext} failed after ${attempt + 1} attempts`, {
                    errorCode,
                    error: lastError.message,
                    isRetryable,
                });

                const finalError = new ExternalServiceError(
                    `Operation failed after ${attempt + 1} attempts: ${lastError.message}`,
                    errorCode,
                    ErrorSeverity.MEDIUM,
                    error,
                    isRetryable
                );
                throw finalError;
            }

            const delayMs = calculateDelay(attempt, fullConfig);
            const logContext = context || 'retry-operation';
            console.warn(`[Resilience] ${logContext} attempt ${attempt + 1} failed, retrying in ${delayMs}ms`, {
                errorCode,
                error: lastError.message,
                nextRetryIn: `${delayMs}ms`,
            });

            await sleep(delayMs);
        }
    }

    throw lastError || new ExternalServiceError('Retry operation failed', ExternalServiceErrorCode.UNKNOWN);
}

/**
 * Calculate delay for retry with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelayMs);

    if (config.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.round(delay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==============================================
// TIMEOUT HANDLING
// ==============================================

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
    timeoutMs: number;
    onTimeout?: () => void;
}

/**
 * Default timeout configuration (10 seconds)
 */
const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
    timeoutMs: 10000,
};

/**
 * Execute a function with timeout
 * 
 * @param fn - Async function to execute
 * @param config - Timeout configuration
 * @param context - Context for logging
 * @returns Result of the function or throws timeout error
 */
export async function withTimeout<T>(
    fn: () => Promise<T>,
    config: Partial<TimeoutConfig> = {},
    context?: string
): Promise<T> {
    const fullConfig: TimeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...config };
    const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
            if (fullConfig.onTimeout) {
                fullConfig.onTimeout();
            }
            
            const timeoutError = new ExternalServiceError(
                `Operation timed out after ${fullConfig.timeoutMs}ms`,
                ExternalServiceErrorCode.TIMEOUT,
                ErrorSeverity.HIGH
            );
            
            const logContext = context || 'timeout-operation';
            console.error(`[Resilience] ${logContext} timed out after ${fullConfig.timeoutMs}ms`);
            
            reject(timeoutError);
        }, fullConfig.timeoutMs);

        return timeoutId;
    });

    try {
        return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
        if (error instanceof ExternalServiceError) {
            throw error;
        }
        throw error;
    }
}

// ==============================================
// CIRCUIT BREAKER
// ==============================================

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
    CLOSED = 'closed',
    OPEN = 'open',
    HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeoutMs: number;
    rollingWindowMs: number;
    minimumCalls: number;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeoutMs: 60000,
    rollingWindowMs: 300000,
    minimumCalls: 5,
};

/**
 * Circuit breaker call result tracking
 */
interface CallResult {
    success: boolean;
    timestamp: number;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime = 0;
    private callHistory: CallResult[] = [];

    constructor(
        private name: string,
        private config: Partial<CircuitBreakerConfig> = {}
    ) {
        this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
        this.cleanupOldHistory();
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;

        if (this.state === CircuitBreakerState.OPEN) {
            if (Date.now() - this.lastFailureTime > fullConfig.timeoutMs) {
                console.info(`[CircuitBreaker] ${this.name} transitioning to HALF_OPEN state`);
                this.state = CircuitBreakerState.HALF_OPEN;
                this.successCount = 0;
            } else {
                throw new ExternalServiceError(
                    `Circuit breaker is OPEN for ${this.name}`,
                    ExternalServiceErrorCode.CIRCUIT_BREAKER_OPEN,
                    ErrorSeverity.HIGH,
                    undefined,
                    false
                );
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            
            if (error instanceof ExternalServiceError) {
                throw error;
            }
            
            throw new ExternalServiceError(
                `Operation failed: ${error instanceof Error ? error.message : String(error)}`,
                ExternalServiceErrorCode.UNKNOWN,
                ErrorSeverity.MEDIUM,
                error
            );
        }
    }

    /**
     * Handle successful call
     */
    private onSuccess(): void {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;

        this.recordCall(true);
        
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.successCount++;
            
            if (this.successCount >= fullConfig.successThreshold) {
                console.info(`[CircuitBreaker] ${this.name} transitioning to CLOSED state`);
                this.state = CircuitBreakerState.CLOSED;
                this.failureCount = 0;
            }
        } else {
            this.successCount = 0;
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed call
     */
    private onFailure(): void {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;

        this.recordCall(false);
        this.failureCount++;
        this.lastFailureTime = Date.now();

        const rollingFailures = this.getRecentFailureCount();
        
        if (rollingFailures >= fullConfig.failureThreshold) {
            const prevState = this.state;
            this.state = CircuitBreakerState.OPEN;
            
            if (prevState !== CircuitBreakerState.OPEN) {
                console.error(`[CircuitBreaker] ${this.name} transitioning to OPEN state after ${rollingFailures} failures`);
            }
        }
    }

    /**
     * Record a call result
     */
    private recordCall(success: boolean): void {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;
        
        this.callHistory.push({
            success,
            timestamp: Date.now(),
        });

        this.cleanupOldHistory();
    }

     /**
     * Clean up old call history outside rolling window
     */
    private cleanupOldHistory(): void {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;
        const cutoffTime = Date.now() - fullConfig.rollingWindowMs;

        this.callHistory = this.callHistory.filter(call => call.timestamp > cutoffTime);
    }

    /**
     * Get recent failure count in rolling window
     */
    private getRecentFailureCount(): number {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;
        const cutoffTime = Date.now() - fullConfig.rollingWindowMs;
        
        const recentCalls = this.callHistory.filter(call => call.timestamp > cutoffTime);
        
        if (recentCalls.length < fullConfig.minimumCalls) {
            return 0;
        }
        
        return recentCalls.filter(call => !call.success).length;
    }

    /**
     * Get current circuit breaker state
     */
    getState(): CircuitBreakerState {
        return this.state;
    }

    /**
     * Get circuit breaker statistics
     */
    getStats(): {
        state: CircuitBreakerState;
        failureCount: number;
        successCount: number;
        recentFailures: number;
        recentSuccesses: number;
    } {
        const fullConfig = this.config as Required<CircuitBreakerConfig>;
        const cutoffTime = Date.now() - fullConfig.rollingWindowMs;
        const recentCalls = this.callHistory.filter(call => call.timestamp > cutoffTime);
        
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            recentFailures: recentCalls.filter(call => !call.success).length,
            recentSuccesses: recentCalls.filter(call => call.success).length,
        };
    }

    /**
     * Reset circuit breaker to CLOSED state
     */
    reset(): void {
        console.info(`[CircuitBreaker] ${this.name} manually reset to CLOSED state`);
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        this.callHistory = [];
    }
}

// ==============================================
// REQUEST/RESPONSE LOGGING
// ==============================================

/**
 * Request/response log entry
 */
export interface RequestLogEntry {
    id: string;
    timestamp: number;
    service: string;
    operation: string;
    success: boolean;
    durationMs: number;
    statusCode?: number;
    errorCode?: ExternalServiceErrorCode;
    errorMessage?: string;
    retryCount?: number;
}

/**
 * Request logger for external API calls
 */
export class RequestLogger {
    private logs: RequestLogEntry[] = [];
    private maxLogs = 1000;

    /**
     * Log a request/response
     */
    log(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>): void {
        const logEntry: RequestLogEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...entry,
        };

        this.logs.push(logEntry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        const logLevel = entry.success ? 'info' : 'error';
        const message = entry.success 
            ? `[RequestLogger] ${entry.service}:${entry.operation} succeeded in ${entry.durationMs}ms`
            : `[RequestLogger] ${entry.service}:${entry.operation} failed after ${entry.durationMs}ms - ${entry.errorMessage}`;

        console[logLevel](message, {
            service: entry.service,
            operation: entry.operation,
            statusCode: entry.statusCode,
            errorCode: entry.errorCode,
            retryCount: entry.retryCount,
        });
    }

    /**
     * Get logs for a service
     */
    getLogs(service?: string, limit?: number): RequestLogEntry[] {
        let filteredLogs = service 
            ? this.logs.filter(log => log.service === service)
            : this.logs;

        if (limit) {
            filteredLogs = filteredLogs.slice(-limit);
        }

        return filteredLogs;
    }

    /**
     * Get success rate for a service
     */
    getSuccessRate(service?: string, timeWindowMs = 300000): number {
        const cutoffTime = Date.now() - timeWindowMs;
        let logs = service 
            ? this.logs.filter(log => log.service === service && log.timestamp > cutoffTime)
            : this.logs.filter(log => log.timestamp > cutoffTime);

        if (logs.length === 0) {
            return 1.0;
        }

        const successCount = logs.filter(log => log.success).length;
        return successCount / logs.length;
    }

    /**
     * Get average duration for a service
     */
    getAverageDuration(service?: string, timeWindowMs = 300000): number {
        const cutoffTime = Date.now() - timeWindowMs;
        let logs = service 
            ? this.logs.filter(log => log.service === service && log.timestamp > cutoffTime)
            : this.logs.filter(log => log.timestamp > cutoffTime);

        if (logs.length === 0) {
            return 0;
        }

        const totalDuration = logs.reduce((sum, log) => sum + log.durationMs, 0);
        return totalDuration / logs.length;
    }

    /**
     * Clear all logs
     */
    clear(): void {
        this.logs = [];
    }

    /**
     * Generate unique log ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Global request logger instance
 */
export const requestLogger = new RequestLogger();

// ==============================================
// COMBINED RESILIENCE WRAPPER
// ==============================================

/**
 * Combined resilience configuration
 */
export interface ResilienceConfig {
    retry?: Partial<RetryConfig>;
    timeout?: Partial<TimeoutConfig>;
    circuitBreaker?: CircuitBreaker;
    enableLogging?: boolean;
}

/**
 * Execute a function with all resilience patterns applied
 * 
 * @param fn - Async function to execute
 * @param serviceName - Name of the external service
 * @param operation - Name of the operation
 * @param config - Resilience configuration
 * @returns Result of the function
 */
export async function withResilience<T>(
    fn: () => Promise<T>,
    serviceName: string,
    operation: string,
    config: ResilienceConfig = {}
): Promise<T> {
    const startTime = Date.now();
    let retryCount = 0;
    const context = `${serviceName}:${operation}`;

    try {
        let result: T;

        if (config.circuitBreaker) {
            result = await config.circuitBreaker.execute(async () => {
                return await executeWithRetryAndTimeout(fn, config.retry, config.timeout, context);
            });
        } else {
            result = await executeWithRetryAndTimeout(fn, config.retry, config.timeout, context);
        }

        if (config.enableLogging) {
            requestLogger.log({
                service: serviceName,
                operation,
                success: true,
                durationMs: Date.now() - startTime,
                retryCount,
            });
        }

        return result;
    } catch (error) {
        if (config.enableLogging) {
            const isExternalServiceError = error instanceof ExternalServiceError;
            requestLogger.log({
                service: serviceName,
                operation,
                success: false,
                durationMs: Date.now() - startTime,
                errorCode: isExternalServiceError ? error.code : ExternalServiceErrorCode.UNKNOWN,
                errorMessage: error instanceof Error ? error.message : String(error),
                retryCount,
            });
        }

        throw error;
    }
}

/**
 * Execute function with retry and timeout (used internally)
 */
async function executeWithRetryAndTimeout<T>(
    fn: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    timeoutConfig?: Partial<TimeoutConfig>,
    context?: string
): Promise<T> {
    return withTimeout(
        () => retryWithBackoff(fn, retryConfig, context),
        timeoutConfig,
        context
    );
}
