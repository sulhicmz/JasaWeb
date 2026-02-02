import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    CircuitBreaker,
    RetryHandler,
    CircuitState,
    resilienceService
} from '@/lib/resilience';

describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker({
            failureThreshold: 3,
            successThreshold: 2,
            timeout: 1000,
            resetTimeout: 5000,
        });
    });

    afterEach(() => {
        circuitBreaker.cleanup();
    });

    it('should execute function successfully in CLOSED state', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await circuitBreaker.execute(fn);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('failure'));

        for (let i = 0; i < 3; i++) {
            await expect(circuitBreaker.execute(fn)).rejects.toThrow('failure');
        }

        expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
        expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('should reject immediately when circuit is OPEN', async () => {
        const fn = vi.fn();

        for (let i = 0; i < 3; i++) {
            await circuitBreaker.execute(() => Promise.reject(new Error('failure')));
        }

        await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
        expect(fn).not.toHaveBeenCalled();
    });

    it('should reset circuit breaker manually', async () => {
        for (let i = 0; i < 3; i++) {
            await circuitBreaker.execute(() => Promise.reject(new Error('failure')));
        }

        expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

        circuitBreaker.reset();

        expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should timeout long-running operations', async () => {
        const fn = () => new Promise((resolve) => setTimeout(resolve, 2000));

        await expect(circuitBreaker.execute(fn)).rejects.toThrow('Timeout after 1000ms');
    });
});

describe('RetryHandler', () => {
    let retryHandler: RetryHandler;

    beforeEach(() => {
        retryHandler = new RetryHandler({
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffMultiplier: 2,
        });
    });

    it('should succeed on first attempt', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await retryHandler.execute(fn);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('ECONNRESET'));

        const isRetryable = (error: Error) => error.message.includes('ECONN');

        await expect(retryHandler.execute(fn, isRetryable)).rejects.toThrow('Operation failed after 3 attempts');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('Not retryable'));

        const isRetryable = (error: Error) => error.message.includes('retry');

        await expect(retryHandler.execute(fn, isRetryable)).rejects.toThrow('Not retryable');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('ResilienceService', () => {
    beforeEach(() => {
        resilienceService.resetCircuitBreaker('midtrans');
    });

    it('should execute function with circuit breaker and retry', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await resilienceService.execute('midtrans', fn);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should apply retry logic', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('ECONNRESET'))
            .mockResolvedValue('success');

        const result = await resilienceService.execute('midtrans', fn, {
            retry: {
                maxAttempts: 3,
                baseDelay: 100,
                maxDelay: 500,
                backoffMultiplier: 2,
            },
        });

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should apply timeout', async () => {
        const fn = vi.fn();

        await expect(resilienceService.execute('midtrans', fn, {
            timeout: 100,
        })).rejects.toThrow('Timeout after 100ms');
    });

    it('should get circuit breaker state', () => {
        const state = resilienceService.getCircuitBreakerState('midtrans');
        expect(state).toBe(CircuitState.CLOSED);
    });

    it('should get circuit breaker stats', () => {
        const stats = resilienceService.getCircuitBreakerStats('midtrans');
        expect(stats).toEqual({
            state: CircuitState.CLOSED,
            failureCount: 0,
        });
    });

    it('should throw error for unknown circuit breaker key', async () => {
        const fn = vi.fn();

        await expect(resilienceService.execute('unknown', fn)).rejects.toThrow(
            'Circuit breaker not found for key: unknown'
        );
    });
});

describe('Resilience Integration Tests', () => {
    beforeEach(() => {
        resilienceService.resetCircuitBreaker('midtrans');
    });

    it('should handle complete failure scenario', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('ECONNRESET'));

        for (let i = 0; i < 6; i++) {
            try {
                await resilienceService.execute('midtrans', fn, {
                    retry: {
                        maxAttempts: 2,
                        baseDelay: 100,
                        maxDelay: 500,
                        backoffMultiplier: 2,
                    },
                });
            } catch {
                // Expected failures
            }
        }

        const state = resilienceService.getCircuitBreakerState('midtrans');
        expect(state).toBe(CircuitState.OPEN);

        await expect(resilienceService.execute('midtrans', fn)).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should recover from OPEN state', async () => {
        const failingFn = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
        const successFn = vi.fn().mockResolvedValue('success');

        for (let i = 0; i < 6; i++) {
            try {
                await resilienceService.execute('midtrans', failingFn, {
                    retry: {
                        maxAttempts: 2,
                        baseDelay: 100,
                        maxDelay: 500,
                        backoffMultiplier: 2,
                    },
                });
            } catch {
                // Expected failures
            }
        }

        expect(resilienceService.getCircuitBreakerState('midtrans')).toBe(CircuitState.OPEN);

        // Reset circuit breaker manually to test recovery
        resilienceService.resetCircuitBreaker('midtrans');

        await resilienceService.execute('midtrans', successFn);
        await resilienceService.execute('midtrans', successFn);

        expect(resilienceService.getCircuitBreakerState('midtrans')).toBe(CircuitState.CLOSED);
    });
});
