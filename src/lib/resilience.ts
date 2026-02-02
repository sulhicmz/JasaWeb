/**
 * Resilience Patterns for External API Integration
 * Implements Circuit Breaker, Retry with Exponential Backoff, and Timeout patterns
 */

export interface CircuitBreakerOptions {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    resetTimeout: number;
}

export interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

export interface ResilienceOptions {
    timeout?: number;
    retry?: RetryOptions;
    circuitBreaker?: CircuitBreakerOptions;
}

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime: number = 0;
    private options: CircuitBreakerOptions;
    private activeTimeouts: Set<NodeJS.Timeout> = new Set();

    constructor(options: CircuitBreakerOptions) {
        this.options = options;
    }

    cleanup(): void {
        this.activeTimeouts.forEach(id => clearTimeout(id));
        this.activeTimeouts.clear();
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime < this.options.resetTimeout) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = CircuitState.HALF_OPEN;
            this.successCount = 0;
        }

        try {
            const result = await Promise.race<T>([
                fn(),
                this.createTimeout<T>(this.options.timeout),
            ]);

            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
            }
        }
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
        } else if (this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }

    private createTimeout<T>(ms: number): Promise<T> {
        return new Promise((_, reject) => {
            const timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
            this.activeTimeouts.add(timeoutId);
        });
    }

    getState(): CircuitState {
        return this.state;
    }

    getFailureCount(): number {
        return this.failureCount;
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
    }
}

export class RetryHandler {
    private options: RetryOptions;

    constructor(options: RetryOptions) {
        this.options = options;
    }

    async execute<T>(fn: () => Promise<T>, isRetryable?: (error: Error) => boolean): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt === this.options.maxAttempts) {
                    break;
                }

                if (isRetryable && !isRetryable(lastError)) {
                    break;
                }

                const delay = this.calculateDelay(attempt);
                await this.sleep(delay);
            }
        }

        throw new Error(`Operation failed after ${this.options.maxAttempts} attempts: ${lastError?.message}`);
    }

    private calculateDelay(attempt: number): number {
        const delay = Math.min(
            this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1),
            this.options.maxDelay
        );
        return delay + Math.random() * delay * 0.1;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class ResilienceService {
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();

    constructor() {
        this.initializeCircuitBreakers();
    }

    private initializeCircuitBreakers(): void {
        this.circuitBreakers.set('midtrans', new CircuitBreaker({
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 10000,
            resetTimeout: 60000,
        }));
    }

    async execute<T>(
        key: string,
        fn: () => Promise<T>,
        options?: ResilienceOptions
    ): Promise<T> {
        const circuitBreaker = this.circuitBreakers.get(key);
        if (!circuitBreaker) {
            throw new Error(`Circuit breaker not found for key: ${key}`);
        }

        const isRetryable = (error: Error) => {
            const retryableErrors = [
                'ECONNRESET',
                'ETIMEDOUT',
                'ENOTFOUND',
                'EAI_AGAIN',
                'Timeout after',
                'Network error',
            ];
            return retryableErrors.some(msg => error.message.includes(msg));
        };

        const retryHandler = options?.retry 
            ? new RetryHandler(options.retry)
            : null;

        const executeWithRetry = async (): Promise<T> => {
            if (retryHandler) {
                return retryHandler.execute(fn, isRetryable);
            }
            return fn();
        };

        return circuitBreaker.execute(executeWithRetry);
    }

    getCircuitBreakerState(key: string): CircuitState | null {
        const circuitBreaker = this.circuitBreakers.get(key);
        return circuitBreaker ? circuitBreaker.getState() : null;
    }

    getCircuitBreakerStats(key: string): { state: CircuitState; failureCount: number } | null {
        const circuitBreaker = this.circuitBreakers.get(key);
        if (!circuitBreaker) return null;

        return {
            state: circuitBreaker.getState(),
            failureCount: circuitBreaker.getFailureCount(),
        };
    }

    resetCircuitBreaker(key: string): void {
        const circuitBreaker = this.circuitBreakers.get(key);
        if (circuitBreaker) {
            circuitBreaker.reset();
        }
    }
}

export const resilienceService = new ResilienceService();
