/**
 * Health Check API Integration Test Suite
 * Tests system health monitoring endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing routes
const mockGetEnvironmentInfo = vi.fn();
const mockMonitoringService = {
    getInstance: vi.fn(),
};

vi.mock('@/lib/config', () => ({
    getEnvironmentInfo: mockGetEnvironmentInfo,
}));

vi.mock('@/lib/monitoring', () => ({
    MonitoringService: mockMonitoringService,
}));

describe('Health Check API - Integration', () => {
    let mockSystemHealth: any;
    let mockEnvInfo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSystemHealth = {
            database: 'up',
            cache: 'up',
            storage: 'up',
            payment: 'up',
            performance: {
                avgResponseTime: 50,
                errorRate: 0.01,
                throughput: 100,
            },
            timestamp: new Date('2024-01-01T00:00:00Z'),
        };

        mockEnvInfo = {
            environment: 'development',
            nodeVersion: '18.0.0',
            platform: 'linux',
            database: 'postgresql',
            cache: 'redis',
            storage: 'r2',
            payment: 'midtrans',
        };

        mockGetEnvironmentInfo.mockReturnValue(mockEnvInfo);
        mockMonitoringService.getInstance.mockReturnValue({
            getSystemHealth: vi.fn().mockResolvedValue(mockSystemHealth),
            recordSecurityEvent: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GET: Health Check', () => {
        it('should return healthy status when all services are up', async () => {
            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('healthy');
            expect(result.data.environment).toBe('development');
            expect(result.data.services).toEqual({
                database: 'up',
                cache: 'up',
                storage: 'up',
                payment: 'up',
            });
            expect(result.data.performance).toEqual({
                avgResponseTime: 50,
                errorRate: 0,
                throughput: 100,
            });
            expect(result.data.timestamp).toBe('2024-01-01T00:00:00.000Z');
            expect(result.data.uptime).toBe('running');
        });

        it('should return unhealthy status when any service is down', async () => {
            mockSystemHealth.database = 'down';
            mockSystemHealth.performance.errorRate = 1.0;

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('unhealthy');
            expect(result.data.services.database).toBe('down');
            expect(result.data.performance.errorRate).toBe(1);
        });

        it('should return unhealthy status when cache is down', async () => {
            mockSystemHealth.cache = 'down';

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('unhealthy');
            expect(result.data.services.cache).toBe('down');
        });

        it('should return unhealthy status when payment service is down', async () => {
            mockSystemHealth.payment = 'down';

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('unhealthy');
            expect(result.data.services.payment).toBe('down');
        });

        it('should return unhealthy status when storage is down', async () => {
            mockSystemHealth.storage = 'down';

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('unhealthy');
            expect(result.data.services.storage).toBe('down');
        });

        it('should return unhealthy status when error rate is high (>=0.9)', async () => {
            mockSystemHealth.performance.errorRate = 0.95;

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.status).toBe('unhealthy');
            expect(result.data.performance.errorRate).toBe(1);
        });

        it('should format performance metrics correctly', async () => {
            mockSystemHealth.performance = {
                avgResponseTime: 123.456,
                errorRate: 0.12345,
                throughput: 987.654,
            };

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.performance.avgResponseTime).toBe(123);
            expect(result.data.performance.errorRate).toBe(0);
            expect(result.data.performance.throughput).toBe(988);
        });

        it('should return timestamp in ISO format', async () => {
            const testTimestamp = new Date('2024-01-01T12:34:56.789Z');
            mockSystemHealth.timestamp = testTimestamp;

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.timestamp).toBe('2024-01-01T12:34:56.789Z');
        });

        it('should handle getSystemHealth errors gracefully', async () => {
            const mockMonitoringInstance = {
                getSystemHealth: vi.fn().mockRejectedValue(new Error('Monitoring service failed')),
                recordSecurityEvent: vi.fn(),
            };

            mockMonitoringService.getInstance.mockReturnValue(mockMonitoringInstance);

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(500);
        });

        it('should record security event on health check errors', async () => {
            const mockMonitoringInstance = {
                getSystemHealth: vi.fn().mockRejectedValue(new Error('Monitoring service failed')),
                recordSecurityEvent: vi.fn(),
            };

            mockMonitoringService.getInstance.mockReturnValue(mockMonitoringInstance);

            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            await healthHandler({ request } as any);

            expect(mockMonitoringInstance.recordSecurityEvent).toHaveBeenCalledWith(
                'health_check_error',
                expect.any(Object),
                'critical'
            );
        });

        it('should include environment information', async () => {
            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.environment).toBe('development');
            expect(mockGetEnvironmentInfo).toHaveBeenCalled();
        });

        it('should always return uptime status', async () => {
            const { GET: healthHandler } = await import('@/pages/api/health');

            const request = new Request('http://localhost/api/health');
            const response = await healthHandler({ request } as any);

            expect(response.status).toBe(200);

            const result = await response.json();
            expect(result.data.uptime).toBe('running');
        });
    });
});
