/**
 * Resilience Utilities Tests
 * Tests for retry, timeout, circuit breaker, and logging patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    retryWithBackoff,
    withTimeout,
    CircuitBreaker,
    CircuitBreakerState,
    RequestLogger,
    requestLogger,
    withResilience,
    ExternalServiceError,
    ExternalServiceErrorCode,
    ErrorSeverity,
} from './resilience';

void requestLogger;

describe('retryWithBackoff', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');
        
        const result = await retryWithBackoff(mockFn);
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
        let attemptCount = 0;
        const mockFn = vi.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 3) {
                throw new Error('Transient failure');
            }
            return 'success';
        });

        const promise = retryWithBackoff(mockFn, {
            maxRetries: 3,
            initialDelayMs: 100,
        });

        await vi.runAllTimersAsync();
        
        const result = await promise;
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
        let errorThrown = false;
        let promiseCompleted = false;

        const promise = retryWithBackoff(mockFn, {
                maxRetries: 2,
                initialDelayMs: 10,
            });

        promise.then(() => {
            promiseCompleted = true;
        }).catch(() => {
            // Expected - error will be caught below
        });

        await vi.runAllTimersAsync();

        expect(promiseCompleted).toBe(false);

        try {
            await promise;
            expect.fail('Should have thrown an error');
        } catch (error) {
            errorThrown = true;
            expect(error).toBeInstanceOf(ExternalServiceError);
        }

        expect(errorThrown).toBe(true);
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
        const delays: number[] = [];
        let attemptCount = 0;
        const mockFn = vi.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 4) {
                throw new Error('Transient failure');
            }
            return 'success';
        });

        const originalSetTimeout = global.setTimeout;
        global.setTimeout = vi.fn((callback, delay) => {
            delays.push(delay);
            return originalSetTimeout(callback, 0);
        }) as unknown as typeof setTimeout;

        try {
            const promise = retryWithBackoff(mockFn, {
                maxRetries: 4,
                initialDelayMs: 100,
                backoffMultiplier: 2,
                jitter: false,
            });

            await vi.runAllTimersAsync();
            await promise;

            expect(delays).toEqual([100, 200, 400]);
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });

    it('should apply jitter to delays', async () => {
        const delays: number[] = [];
        let attemptCount = 0;
        const mockFn = vi.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 3) {
                throw new Error('Transient failure');
            }
            return 'success';
        });

        const originalSetTimeout = global.setTimeout;
        global.setTimeout = vi.fn((callback, delay) => {
            delays.push(delay);
            return originalSetTimeout(callback, 0);
        }) as unknown as typeof setTimeout;

        try {
            const promise = retryWithBackoff(mockFn, {
                maxRetries: 3,
                initialDelayMs: 500,
                backoffMultiplier: 1.5,
                jitter: true,
            });

            await vi.runAllTimersAsync();
            await promise;

            expect(delays.length).toBe(2);
            delays.forEach(delay => {
                expect(delay).toBeGreaterThan(250);
                expect(delay).toBeLessThan(1000);
            });
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });

    it('should respect max delay', async () => {
        const delays: number[] = [];
        let attemptCount = 0;
        const mockFn = vi.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 5) {
                throw new Error('Transient failure');
            }
            return 'success';
        });

        const originalSetTimeout = global.setTimeout;
        global.setTimeout = vi.fn((callback, delay) => {
            delays.push(delay);
            return originalSetTimeout(callback, 0);
        }) as unknown as typeof setTimeout;

        try {
            const promise = retryWithBackoff(mockFn, {
                maxRetries: 5,
                initialDelayMs: 1000,
                maxDelayMs: 2000,
                backoffMultiplier: 10,
                jitter: false,
            });

            await vi.runAllTimersAsync();
            await promise;

            delays.forEach(delay => {
                expect(delay).toBeLessThanOrEqual(2000);
            });
        } finally {
            global.setTimeout = originalSetTimeout;
        }
    });

    it('should not retry non-retryable errors', async () => {
        const mockFn = vi.fn().mockRejectedValue(
            new ExternalServiceError(
                'Authentication failed',
                ExternalServiceErrorCode.AUTHENTICATION_FAILED,
                ErrorSeverity.CRITICAL,
                undefined,
                false
            )
        );

        await expect(retryWithBackoff(mockFn)).rejects.toThrow();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});

describe('withTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should complete successfully before timeout', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');

        const result = await withTimeout(mockFn, { timeoutMs: 1000 });

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw timeout error when exceeding timeout', async () => {
        const mockFn = vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve('success'), 2000))
        );

        const promise = withTimeout(mockFn, { timeoutMs: 1000 });

        vi.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow(ExternalServiceError);
        const error = await promise.catch((e) => e);
        if (error instanceof ExternalServiceError) {
            expect(error.code).toBe(ExternalServiceErrorCode.TIMEOUT);
        }
    });

    it('should call onTimeout callback when timeout occurs', async () => {
        const onTimeout = vi.fn();
        const mockFn = vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve('success'), 2000))
        );

        const promise = withTimeout(mockFn, { timeoutMs: 1000, onTimeout });

        vi.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow();
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should pass through non-timeout errors', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Operation failed'));

        await expect(withTimeout(mockFn, { timeoutMs: 1000 })).rejects.toThrow('Operation failed');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});

describe('CircuitBreaker', () => {
    it('should start in CLOSED state', () => {
        const cb = new CircuitBreaker('test');
        expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should stay CLOSED on successful calls', async () => {
        const cb = new CircuitBreaker('test', { failureThreshold: 3 });
        const mockFn = vi.fn().mockResolvedValue('success');

        await cb.execute(mockFn);
        await cb.execute(mockFn);

        expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should open after reaching failure threshold', async () => {
        const cb = new CircuitBreaker('test', { 
            failureThreshold: 3,
            minimumCalls: 3,
        });
        const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

        await expect(cb.execute(mockFn)).rejects.toThrow();
        await expect(cb.execute(mockFn)).rejects.toThrow();
        await expect(cb.execute(mockFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should reject calls when OPEN', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            minimumCalls: 2,
        });
        const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

        await expect(cb.execute(mockFn)).rejects.toThrow();
        await expect(cb.execute(mockFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        mockFn.mockClear();
        const error = await cb.execute(mockFn).catch((e) => e);
        expect(error).toBeInstanceOf(ExternalServiceError);
        expect(mockFn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after timeout', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            minimumCalls: 2,
            timeoutMs: 1000,
        });
        const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

        await expect(cb.execute(mockFn)).rejects.toThrow();
        await expect(cb.execute(mockFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        const successFn = vi.fn().mockResolvedValue('success');
        await cb.execute(successFn);

        expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should close after success threshold in HALF_OPEN', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            successThreshold: 2,
            minimumCalls: 2,
            timeoutMs: 1000,
        });
        const failFn = vi.fn().mockRejectedValue(new Error('Failed'));
        const successFn = vi.fn().mockResolvedValue('success');

        await expect(cb.execute(failFn)).rejects.toThrow();
        await expect(cb.execute(failFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        await cb.execute(successFn);
        expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

        await cb.execute(successFn);
        expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen on failure in HALF_OPEN', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            successThreshold: 3,
            minimumCalls: 2,
            timeoutMs: 1000,
        });
        const failFn = vi.fn().mockRejectedValue(new Error('Failed'));
        const successFn = vi.fn().mockResolvedValue('success');

        await expect(cb.execute(failFn)).rejects.toThrow();
        await expect(cb.execute(failFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        await cb.execute(successFn);
        expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

        await expect(cb.execute(failFn)).rejects.toThrow();
        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should track statistics correctly', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 3,
            minimumCalls: 2,
        });
        const successFn = vi.fn().mockResolvedValue('success');
        const failFn = vi.fn().mockRejectedValue(new Error('Failed'));

        await cb.execute(successFn);
        await cb.execute(successFn);
        await expect(cb.execute(failFn)).rejects.toThrow();

        const stats = cb.getStats();
        expect(stats.state).toBe(CircuitBreakerState.CLOSED);
        expect(stats.successCount).toBe(0);
        expect(stats.failureCount).toBe(1);
        expect(stats.recentSuccesses).toBe(2);
        expect(stats.recentFailures).toBe(1);
    });

    it('should reset to CLOSED state', async () => {
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            minimumCalls: 2,
        });
        const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

        await expect(cb.execute(mockFn)).rejects.toThrow();
        await expect(cb.execute(mockFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        cb.reset();
        expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
        const stats = cb.getStats();
        expect(stats.failureCount).toBe(0);
    });
});

describe('RequestLogger', () => {
    it('should log successful requests', () => {
        const logger = new RequestLogger();
        logger.log({
            service: 'test-service',
            operation: 'test-operation',
            success: true,
            durationMs: 100,
        });

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].service).toBe('test-service');
        expect(logs[0].operation).toBe('test-operation');
        expect(logs[0].success).toBe(true);
        expect(logs[0].durationMs).toBe(100);
    });

    it('should log failed requests', () => {
        const logger = new RequestLogger();
        logger.log({
            service: 'test-service',
            operation: 'test-operation',
            success: false,
            durationMs: 200,
            errorCode: ExternalServiceErrorCode.TIMEOUT,
            errorMessage: 'Timeout occurred',
            retryCount: 3,
        });

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].success).toBe(false);
        expect(logs[0].errorCode).toBe(ExternalServiceErrorCode.TIMEOUT);
        expect(logs[0].errorMessage).toBe('Timeout occurred');
        expect(logs[0].retryCount).toBe(3);
    });

    it('should filter logs by service', () => {
        const logger = new RequestLogger();
        logger.log({ service: 'service-a', operation: 'op1', success: true, durationMs: 100 });
        logger.log({ service: 'service-b', operation: 'op2', success: true, durationMs: 100 });
        logger.log({ service: 'service-a', operation: 'op3', success: false, durationMs: 100 });

        const logsA = logger.getLogs('service-a');
        expect(logsA).toHaveLength(2);
        expect(logsA.every(log => log.service === 'service-a')).toBe(true);
    });

    it('should limit returned logs', () => {
        const logger = new RequestLogger();
        for (let i = 0; i < 10; i++) {
            logger.log({ service: 'test', operation: 'op', success: true, durationMs: 100 });
        }

        const limitedLogs = logger.getLogs('test', 5);
        expect(limitedLogs).toHaveLength(5);
    });

    it('should calculate success rate', () => {
        const logger = new RequestLogger();
        logger.log({ service: 'test', operation: 'op1', success: true, durationMs: 100 });
        logger.log({ service: 'test', operation: 'op2', success: true, durationMs: 100 });
        logger.log({ service: 'test', operation: 'op3', success: false, durationMs: 100 });
        logger.log({ service: 'test', operation: 'op4', success: true, durationMs: 100 });

        const successRate = logger.getSuccessRate('test');
        expect(successRate).toBe(0.75);
    });

    it('should return 1.0 success rate when no logs', () => {
        const logger = new RequestLogger();
        const successRate = logger.getSuccessRate('test');
        expect(successRate).toBe(1.0);
    });

    it('should calculate average duration', () => {
        const logger = new RequestLogger();
        logger.log({ service: 'test', operation: 'op1', success: true, durationMs: 100 });
        logger.log({ service: 'test', operation: 'op2', success: true, durationMs: 200 });
        logger.log({ service: 'test', operation: 'op3', success: true, durationMs: 300 });

        const avgDuration = logger.getAverageDuration('test');
        expect(avgDuration).toBe(200);
    });

    it('should clear all logs', () => {
        const logger = new RequestLogger();
        logger.log({ service: 'test', operation: 'op', success: true, durationMs: 100 });
        logger.log({ service: 'test', operation: 'op', success: true, durationMs: 100 });

        expect(logger.getLogs()).toHaveLength(2);
        logger.clear();
        expect(logger.getLogs()).toHaveLength(0);
    });
});

describe('withResilience', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should execute function successfully with all resilience patterns', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');
        const cb = new CircuitBreaker('test');

        const result = await withResilience(
            mockFn,
            'test-service',
            'test-operation',
            {
                circuitBreaker: cb,
                timeout: { timeoutMs: 1000 },
                retry: { maxRetries: 2, initialDelayMs: 100 },
                enableLogging: true,
            }
        );

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should retry on transient failures', async () => {
        let attemptCount = 0;
        const mockFn = vi.fn().mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 3) {
                throw new Error('Transient failure');
            }
            return 'success';
        });
        const cb = new CircuitBreaker('test');

        const promise = withResilience(
            mockFn,
            'test-service',
            'test-operation',
            {
                circuitBreaker: cb,
                timeout: { timeoutMs: 1000 },
                retry: { maxRetries: 3, initialDelayMs: 100 },
                enableLogging: true,
            }
        );

        await vi.runAllTimersAsync();
        
        const result = await promise;
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should timeout on slow operations', async () => {
        const mockFn = vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve('success'), 2000))
        );
        const cb = new CircuitBreaker('test');

        const promise = withResilience(
            mockFn,
            'test-service',
            'test-operation',
            {
                circuitBreaker: cb,
                timeout: { timeoutMs: 1000 },
            }
        );

        vi.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow(ExternalServiceError);
    });

    it('should respect circuit breaker state', async () => {
        const failFn = vi.fn().mockRejectedValue(new Error('Failed'));
        const cb = new CircuitBreaker('test', {
            failureThreshold: 2,
            minimumCalls: 2,
        });

        await expect(cb.execute(failFn)).rejects.toThrow();
        await expect(cb.execute(failFn)).rejects.toThrow();

        expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

        const mockFn = vi.fn().mockResolvedValue('success');
        await expect(
            withResilience(mockFn, 'test', 'op', { circuitBreaker: cb })
        ).rejects.toThrow(ExternalServiceError);

        expect(mockFn).not.toHaveBeenCalled();
    });
});
