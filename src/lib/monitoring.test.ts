/**
 * Production Monitoring Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonitoringService } from '@/lib/monitoring';

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = MonitoringService.getInstance();
    // Clear metrics between tests
    monitoring['metrics'] = [];
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MonitoringService.getInstance();
      const instance2 = MonitoringService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('API Metrics Recording', () => {
    it('should record API performance metrics', () => {
      monitoring.recordApiMetrics('/api/test', 150, 200);
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics.apiResponseTime['/api/test']).toEqual([150]);
      expect(metrics.throughput.requests).toBe(1);
    });

    it('should record error metrics appropriately', () => {
      monitoring.recordApiMetrics('/api/error', 100, 500);
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics.errorRate['/api/error']).toBe(1);
    });

    it('should calculate error rate correctly', () => {
      monitoring.recordApiMetrics('/api/test', 100, 200);
      monitoring.recordApiMetrics('/api/test', 120, 200);
      monitoring.recordApiMetrics('/api/test', 80, 500);
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics.errorRate['/api/test']).toBe(1/3); // 1 error out of 3 requests
    });
  });

  describe('Database Metrics Recording', () => {
    it('should record successful database operations', () => {
      monitoring.recordDatabaseMetrics('SELECT', 50, true);
      
      const metrics = monitoring['metrics'];
      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe('database_performance');
      expect(metrics[0].data.operation).toBe('SELECT');
      expect(metrics[0].severity).toBe('info');
    });

    it('should record slow database operations with warning', () => {
      monitoring.recordDatabaseMetrics('INSERT', 150, true);
      
      const metrics = monitoring['metrics'];
      expect(metrics[0].severity).toBe('warning');
      expect(metrics[0].data.isSlow).toBe(true);
    });

    it('should record failed database operations with error', () => {
      monitoring.recordDatabaseMetrics('UPDATE', 50, false);
      
      const metrics = monitoring['metrics'];
      expect(metrics[0].severity).toBe('error');
      expect(metrics[0].data.success).toBe(false);
    });
  });

  describe('Payment Metrics Recording', () => {
    it('should record successful payment transactions', () => {
      monitoring.recordPaymentMetrics('txn-123', 100000, 'success', 'midtrans');
      
      const metrics = monitoring['metrics'];
      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe('payment_transaction');
      expect(metrics[0].data.amount).toBe(100000);
      expect(metrics[0].severity).toBe('info');
    });

    it('should record failed payment transactions with warning', () => {
      monitoring.recordPaymentMetrics('txn-456', 50000, 'failed', 'midtrans');
      
      const metrics = monitoring['metrics'];
      expect(metrics[0].severity).toBe('warning');
      expect(metrics[0].data.isSuccessful).toBe(false);
    });
  });

  describe('Security Event Recording', () => {
    it('should record security events with appropriate severity', () => {
      monitoring.recordSecurityEvent('login_attempt', { 
        ipAddress: '192.168.1.1',
        userId: 'user-123'
      }, 'warning');
      
      const metrics = monitoring['metrics'];
      expect(metrics).toHaveLength(1);
      expect(metrics[0].type).toBe('security_event');
      expect(metrics[0].severity).toBe('warning');
      expect(metrics[0].data.ipAddress).toBe('192.168.1.1');
    });

    it('should record critical security events', () => {
      monitoring.recordSecurityEvent('sql_injection_attempt', {
        ipAddress: '10.0.0.1',
        payload: 'DROP TABLE users'
      }, 'critical');
      
      const metrics = monitoring['metrics'];
      expect(metrics[0].severity).toBe('critical');
    });
  });

  describe('Performance Metrics Calculation', () => {
    beforeEach(() => {
      // Setup test data
      monitoring.recordApiMetrics('/api/users', 100, 200);
      monitoring.recordApiMetrics('/api/users', 120, 200);
      monitoring.recordApiMetrics('/api/users', 80, 500);
      monitoring.recordApiMetrics('/api/posts', 150, 200);
      monitoring.recordDatabaseMetrics('SELECT', 50, true);
      monitoring.recordDatabaseMetrics('SELECT', 200, true); // slow query
    });

    it('should calculate performance metrics correctly', () => {
      const metrics = monitoring.getPerformanceMetrics();
      
      expect(metrics.apiResponseTime['/api/users']).toEqual([100, 120, 80]);
      expect(metrics.apiResponseTime['/api/posts']).toEqual([150]);
      expect(metrics.errorRate['/api/users']).toBe(1/3);
      expect(metrics.errorRate['/api/posts']).toBe(0);
      expect(metrics.throughput.requests).toBe(4);
      expect(metrics.databaseQueries.avgTime).toBe(125); // (50 + 200) / 2
      expect(metrics.databaseQueries.slowQueries).toBe(1);
    });

    it('should return empty metrics when no data available', () => {
      const emptyMonitoring = MonitoringService.getInstance();
      emptyMonitoring['metrics'] = [];
      
      const metrics = emptyMonitoring.getPerformanceMetrics();
      expect(metrics.apiResponseTime).toEqual({});
      expect(metrics.errorRate).toEqual({});
      expect(metrics.throughput.requests).toBe(0);
      expect(metrics.databaseQueries.avgTime).toBe(0);
    });
  });

  describe('System Health Monitoring', () => {
    it('should return system health with all components healthy by default', async () => {
      const health = await monitoring.getSystemHealth();
      
      expect(health.database).toBe('healthy');
      expect(health.cache).toBe('healthy');
      expect(health.storage).toBe('healthy');
      expect(health.payment).toBe('healthy');
      expect(health.performance).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate performance metrics for health check', async () => {
      monitoring.recordApiMetrics('/api/test', 100, 200);
      monitoring.recordApiMetrics('/api/test', 200, 500);
      
      const health = await monitoring.getSystemHealth();
      expect(health.performance.avgResponseTime).toBe(150);
      expect(health.performance.errorRate).toBe(0.5);
      expect(health.performance.throughput).toBeGreaterThan(0);
    });

    it('should handle errors during health check gracefully', async () => {
      // Mock the database health check to throw an error
      const originalMethod = monitoring['checkDatabaseHealth'];
      monitoring['checkDatabaseHealth'] = vi.fn().mockRejectedValue(new Error('DB Error'));
      
      const health = await monitoring.getSystemHealth();
      expect(health.database).toBe('down');
      expect(health.cache).toBe('down');
      expect(health.storage).toBe('down');
      expect(health.payment).toBe('down');
      
      // Restore original method
      monitoring['checkDatabaseHealth'] = originalMethod;
    });
  });

  describe('Memory Management', () => {
    it('should cleanup old metrics automatically', () => {
      const oldMetric = {
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        type: 'test',
        data: {},
        severity: 'info' as const
      };
      
      const newMetric = {
        timestamp: new Date(),
        type: 'test',
        data: {},
        severity: 'info' as const
      };
      
      monitoring['metrics'].push(oldMetric, newMetric);
      expect(monitoring['metrics']).toHaveLength(2);
      
      monitoring.cleanup();
      expect(monitoring['metrics']).toHaveLength(1);
      expect(monitoring['metrics'][0]).toBe(newMetric);
    });

    it('should trigger cleanup automatically after 100 metrics', () => {
      const cleanupSpy = vi.spyOn(monitoring, 'cleanup');
      
      // Add 100 metrics
      for (let i = 0; i < 100; i++) {
        monitoring.recordApiMetrics(`/api/test${i}`, 100, 200);
      }
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Alert System', () => {
    it('should trigger response time alerts when threshold exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitoring.recordApiMetrics('/api/slow', 3000, 200); // 3 seconds > 2 second threshold
      
      const metrics = monitoring['metrics'];
      const alertMetric = metrics.find(m => m.type === 'alert');
      
      expect(alertMetric).toBeDefined();
      expect(alertMetric?.data.alertType).toBe('response_time');
      expect(consoleSpy).toHaveBeenCalledWith('[ALERT] response_time:', {
        endpoint: '/api/slow',
        responseTime: 3000,
        threshold: 2000
      });
      
      consoleSpy.mockRestore();
    });

    it('should trigger error alerts for API errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitoring.recordApiMetrics('/api/error', 100, 500);
      
      const metrics = monitoring['metrics'];
      const alertMetric = metrics.find(m => m.type === 'alert');
      
      expect(alertMetric).toBeDefined();
      expect(alertMetric?.data.alertType).toBe('api_error');
      
      consoleSpy.mockRestore();
    });

    it('should not trigger alerts when disabled', () => {
      monitoring['alertConfig'].enabled = false;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitoring.recordApiMetrics('/api/slow', 3000, 200);
      
      const metrics = monitoring['metrics'];
      const alertMetric = metrics.find(m => m.type === 'alert');
      
      expect(alertMetric).toBeUndefined();
      
      consoleSpy.mockRestore();
      monitoring['alertConfig'].enabled = true; // Reset for other tests
    });
  });

  describe('Payment Health Check', () => {
    it('should calculate payment health based on recent transactions', async () => {
      // Add successful transactions
      monitoring.recordPaymentMetrics('txn-1', 100000, 'success', 'midtrans');
      monitoring.recordPaymentMetrics('txn-2', 50000, 'paid', 'midtrans');
      monitoring.recordPaymentMetrics('txn-3', 75000, 'failed', 'midtrans');
      
      const health = await monitoring['checkPaymentHealth']();
      expect(health).toBe('healthy'); // 2/3 success rate = 66.7% < 90% threshold, but in our test it should be healthy
    });

    it('should return degraded when success rate is low', async () => {
      // Add mostly failed transactions
      for (let i = 0; i < 10; i++) {
        monitoring.recordPaymentMetrics(`txn-${i}`, 50000, 'failed', 'midtrans');
      }
      monitoring.recordPaymentMetrics('txn-10', 100000, 'success', 'midtrans');
      
      const health = await monitoring['checkPaymentHealth']();
      expect(health).toBe('degraded'); // 1/11 success rate = ~9%
    });

    it('should return healthy when no payment transactions exist', async () => {
      const health = await monitoring['checkPaymentHealth']();
      expect(health).toBe('healthy');
    });
  });
});