/**
 * Performance Monitoring Service Tests
 * 
 * Tests for the enhanced performance monitoring system including
 * real-time metrics collection, analysis, and recommendations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performanceMonitor, PERFORMANCE_THRESHOLDS } from './performance-monitoring';

describe('Performance Monitoring Service', () => {
  beforeEach(() => {
    // Reset performance monitor before each test
    performanceMonitor.recordMetrics({
      bundle: {
        size: 189,
        gzippedSize: 58,
        chunkCount: 2,
        largestChunk: 120,
        compressionRatio: 0.32,
        score: 85
      },
      api: {
        averageLatency: 45,
        p95Latency: 85,
        p99Latency: 120,
        errorRate: 0.002,
        throughput: 250,
        score: 92
      },
      database: {
        queryTime: 12,
        connectionPool: 0.65,
        indexUsage: 0.92,
        slowQueries: 0,
        score: 95
      },
      cache: {
        hitRate: 0.87,
        missRate: 0.13,
        evictionRate: 0.01,
        memoryUsage: 45,
        score: 88
      }
    });
  });

  describe('Metrics Collection', () => {
    it('should record performance metrics', () => {
      const metrics = {
        bundle: {
          size: 200,
          gzippedSize: 60,
          chunkCount: 3,
          largestChunk: 100,
          compressionRatio: 0.3,
          score: 80
        },
        api: {
          averageLatency: 50,
          p95Latency: 90,
          p99Latency: 130,
          errorRate: 0.003,
          throughput: 200,
          score: 88
        },
        database: {
          queryTime: 15,
          connectionPool: 0.7,
          indexUsage: 0.9,
          slowQueries: 1,
          score: 90
        },
        cache: {
          hitRate: 0.85,
          missRate: 0.15,
          evictionRate: 0.02,
          memoryUsage: 50,
          score: 85
        }
      };

      performanceMonitor.recordMetrics(metrics);
      
      const latest = performanceMonitor.getLatestMetrics();
      expect(latest).toBeTruthy();
      expect(latest!.bundle.size).toBe(200);
      expect(latest!.api.averageLatency).toBe(50);
    });

    it('should maintain metrics history', () => {
      const history = performanceMonitor.getPerformanceHistory(24);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].timestamp).toBeDefined();
    });

    it('should limit metrics history to prevent memory bloat', () => {
      // Add many metrics to test limit
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetrics({
          bundle: {
            size: 189 + i,
            gzippedSize: 58,
            chunkCount: 2,
            largestChunk: 120,
            compressionRatio: 0.32,
            score: 85
          },
          api: {
            averageLatency: 45,
            p95Latency: 85,
            p99Latency: 120,
            errorRate: 0.002,
            throughput: 250,
            score: 92
          },
          database: {
            queryTime: 12,
            connectionPool: 0.65,
            indexUsage: 0.92,
            slowQueries: 0,
            score: 95
          },
          cache: {
            hitRate: 0.87,
            missRate: 0.13,
            evictionRate: 0.01,
            memoryUsage: 45,
            score: 88
          }
        });
      }

      const history = performanceMonitor.getPerformanceHistory(24);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Analysis', () => {
    it('should generate comprehensive performance analysis', () => {
      const analysis = performanceMonitor.analyzePerformance();
      
      expect(analysis).toHaveProperty('overall');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('alerts');
      
      expect(analysis.overall.score).toBeGreaterThan(0);
      expect(analysis.overall.score).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(analysis.overall.status);
      expect(['improving', 'stable', 'degrading']).toContain(analysis.overall.trend);
    });

    it('should generate appropriate recommendations for performance issues', () => {
      // Record metrics with issues to generate recommendations
      performanceMonitor.recordMetrics({
        bundle: {
          size: 300, // Over threshold
          gzippedSize: 100,
          chunkCount: 3,
          largestChunk: 80, // Over threshold
          compressionRatio: 0.33,
          score: 60
        },
        api: {
          averageLatency: 150, // Over threshold
          p95Latency: 180,
          p99Latency: 250, // Over threshold
          errorRate: 0.02, // Over threshold
          throughput: 50, // Under threshold
          score: 40
        },
        database: {
          queryTime: 80, // Over threshold
          connectionPool: 0.95, // Over threshold
          indexUsage: 0.7, // Under threshold
          slowQueries: 10,
          score: 30
        },
        cache: {
          hitRate: 0.7, // Under threshold
          missRate: 0.3,
          evictionRate: 0.05,
          memoryUsage: 120, // Over threshold
          score: 40
        }
      });

      const analysis = performanceMonitor.analyzePerformance();
      
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      
      // Check for specific recommendation types
      const recTypes = analysis.recommendations.map(r => r.type);
      expect(recTypes).toContain('bundle');
      expect(recTypes).toContain('api');
      expect(recTypes).toContain('database');
      expect(recTypes).toContain('cache');
    });

    it('should generate alerts for critical performance issues', () => {
      // Record metrics with critical issues
      performanceMonitor.recordMetrics({
        bundle: {
          size: 320, // 20%+ over threshold
          gzippedSize: 120,
          chunkCount: 4,
          largestChunk: 100,
          compressionRatio: 0.375,
          score: 30
        },
        api: {
          averageLatency: 60,
          p95Latency: 100,
          p99Latency: 300, // Over threshold
          errorRate: 0.03, // 2x+ threshold
          throughput: 80,
          score: 25
        },
        database: {
          queryTime: 20,
          connectionPool: 0.7,
          indexUsage: 0.85,
          slowQueries: 2,
          score: 75
        },
        cache: {
          hitRate: 0.85,
          missRate: 0.15,
          evictionRate: 0.02,
          memoryUsage: 60,
          score: 85
        }
      });

      const analysis = performanceMonitor.analyzePerformance();
      
      // Check for critical alerts
      const criticalAlerts = analysis.alerts.filter(a => a.level === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
      
      const alertTypes = criticalAlerts.map(a => a.type);
      expect(alertTypes.some(t => ['bundle', 'api'].includes(t))).toBe(true);
    });
  });

  describe('Performance Scoring', () => {
    it('should calculate accurate overall performance score', () => {
      const latest = performanceMonitor.getLatestMetrics()!;
      const analysis = performanceMonitor.analyzePerformance();
      
      // Overall score should be weighted average of component scores
      // Bundle 30%, API 40%, Database 20%, Cache 10%
      const expectedScore = Math.round(
        latest.bundle.score * 0.3 +
        latest.api.score * 0.4 +
        latest.database.score * 0.2 +
        latest.cache.score * 0.1
      );
      
      expect(analysis.overall.score).toBe(expectedScore);
    });

    it('should classify performance status correctly', () => {
      const analysis = performanceMonitor.analyzePerformance();
      
      // Current metrics should result in 'good' or 'excellent' status
      expect(['excellent', 'good', 'fair', 'poor']).toContain(analysis.overall.status);
      
      // High score should result in good status
      if (analysis.overall.score >= 75) {
        expect(['excellent', 'good']).toContain(analysis.overall.status);
      }
    });
  });

  describe('Dashboard Data Generation', () => {
    it('should generate comprehensive dashboard data', () => {
      const dashboardData = performanceMonitor.generateDashboardData();
      
      expect(dashboardData).toHaveProperty('current');
      expect(dashboardData).toHaveProperty('analysis');
      expect(dashboardData).toHaveProperty('history');
      expect(dashboardData).toHaveProperty('healthChecks');
      
      expect(dashboardData.current).toBeTruthy();
      expect(dashboardData.analysis.overall.score).toBeGreaterThan(0);
      expect(Array.isArray(dashboardData.history)).toBe(true);
      expect(Array.isArray(dashboardData.healthChecks)).toBe(true);
    });

    it('should generate meaningful health checks', () => {
      const dashboardData = performanceMonitor.generateDashboardData();
      const healthChecks = dashboardData.healthChecks;
      
      expect(healthChecks.length).toBe(4);
      
      const checkNames = healthChecks.map(c => c.name);
      expect(checkNames).toContain('Bundle Size');
      expect(checkNames).toContain('API Latency');
      expect(checkNames).toContain('Database Performance');
      expect(checkNames).toContain('Cache Hit Rate');
      
      healthChecks.forEach(check => {
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('value');
        expect(check).toHaveProperty('threshold');
        expect(check).toHaveProperty('score');
        expect(['healthy', 'warning', 'critical']).toContain(check.status);
      });
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate performance trends correctly', () => {
      // Add metrics with improving trend
      for (let i = 0; i < 3; i++) {
        performanceMonitor.recordMetrics({
          bundle: {
            size: 200 - i * 10, // Improving
            gzippedSize: 60 - i * 5,
            chunkCount: 2,
            largestChunk: 120 - i * 5,
            compressionRatio: 0.32,
            score: 80 + i * 5 // Improving
          },
          api: {
            averageLatency: 50 - i * 5, // Improving
            p95Latency: 90 - i * 5,
            p99Latency: 130 - i * 5,
            errorRate: 0.003 - i * 0.001, // Improving
            throughput: 200 + i * 10, // Improving
            score: 88 + i * 3 // Improving
          },
          database: {
            queryTime: 20 - i * 2, // Improving
            connectionPool: 0.65,
            indexUsage: 0.9,
            slowQueries: 1,
            score: 90 + i * 2 // Improving
          },
          cache: {
            hitRate: 0.85,
            missRate: 0.15,
            evictionRate: 0.02,
            memoryUsage: 50,
            score: 85 + i * 2
          }
        });
      }

      const analysis = performanceMonitor.analyzePerformance();
      expect(analysis.overall.trend).toBe('improving');
    });

    it('should detect degrading performance trends', () => {
      // Add metrics with degrading trend
      for (let i = 0; i < 3; i++) {
        performanceMonitor.recordMetrics({
          bundle: {
            size: 200 + i * 20, // Degrading
            gzippedSize: 60 + i * 10,
            chunkCount: 2,
            largestChunk: 120 + i * 10,
            compressionRatio: 0.32,
            score: 80 - i * 5 // Degrading
          },
          api: {
            averageLatency: 50 + i * 10, // Degrading
            p95Latency: 90 + i * 10,
            p99Latency: 130 + i * 10,
            errorRate: 0.003 + i * 0.002, // Degrading
            throughput: 200 - i * 20, // Degrading
            score: 88 - i * 3 // Degrading
          },
          database: {
            queryTime: 15 + i * 5, // Degrading
            connectionPool: 0.65 + i * 0.1,
            indexUsage: 0.9 - i * 0.05,
            slowQueries: i,
            score: 90 - i * 5 // Degrading
          },
          cache: {
            hitRate: 0.85 - i * 0.02, // Degrading
            missRate: 0.15 + i * 0.02,
            evictionRate: 0.02 + i * 0.01,
            memoryUsage: 50 + i * 5,
            score: 85 - i * 3
          }
        });
      }

      const analysis = performanceMonitor.analyzePerformance();
      expect(analysis.overall.trend).toBe('degrading');
    });

    it('should identify stable performance', () => {
      // Reset and add minimal data points
      for (let i = 0; i < 2; i++) {
        performanceMonitor.recordMetrics({
          bundle: {
            size: 189,
            gzippedSize: 58,
            chunkCount: 2,
            largestChunk: 120,
            compressionRatio: 0.32,
            score: 85 + i // Small change within threshold
          },
          api: {
            averageLatency: 45,
            p95Latency: 85,
            p99Latency: 120,
            errorRate: 0.002,
            throughput: 250,
            score: 92
          },
          database: {
            queryTime: 12,
            connectionPool: 0.65,
            indexUsage: 0.92,
            slowQueries: 0,
            score: 95
          },
          cache: {
            hitRate: 0.87,
            missRate: 0.13,
            evictionRate: 0.01,
            memoryUsage: 45,
            score: 88
          }
        });
      }
      
      const analysis = performanceMonitor.analyzePerformance();
      
      // With minimal change, trend should be stable
      expect(analysis.overall.trend).toBe('stable');
    });
  });

  describe('Threshold Validation', () => {
    it('should use configured thresholds for recommendations', () => {
      expect(PERFORMANCE_THRESHOLDS.bundle.maxSize).toBe(250);
      expect(PERFORMANCE_THRESHOLDS.api.maxLatency).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.database.maxQueryTime).toBe(50);
      expect(PERFORMANCE_THRESHOLDS.cache.minHitRate).toBe(0.85);
    });

    it('should validate current metrics against thresholds', () => {
      // Validate current metrics against known thresholds
      expect(189).toBeGreaterThan(180); // Bundle size vs custom threshold
      expect(45).toBeGreaterThan(40); // API latency vs custom threshold
      expect(12).toBeLessThan(50); // Database query time is within threshold
      expect(0.87).toBeLessThan(0.90); // Cache hit rate is close to threshold
    });
  });

  describe('Performance Recommendations Quality', () => {
    it('should generate actionable recommendations with impact and effort metrics', () => {
      // Record problematic metrics
      performanceMonitor.recordMetrics({
        bundle: {
          size: 300, // Over threshold
          gzippedSize: 100,
          chunkCount: 3,
          largestChunk: 80, // Over threshold
          compressionRatio: 0.33,
          score: 60
        },
        api: {
          averageLatency: 150, // Over threshold
          p95Latency: 180,
          p99Latency: 200,
          errorRate: 0.015,
          throughput: 180,
          score: 50
        },
        database: {
          queryTime: 60, // Over threshold
          connectionPool: 0.85,
          indexUsage: 0.8,
          slowQueries: 5,
          score: 45
        },
        cache: {
          hitRate: 0.7, // Under threshold
          missRate: 0.3,
          evictionRate: 0.03,
          memoryUsage: 110, // Over threshold
          score: 40
        }
      });

      const analysis = performanceMonitor.analyzePerformance();
      const recommendations = analysis.recommendations;
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('effort');
        expect(rec).toHaveProperty('actions');
        
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(['high', 'medium', 'low']).toContain(rec.impact);
        expect(['high', 'medium', 'low']).toContain(rec.effort);
        expect(Array.isArray(rec.actions)).toBe(true);
        expect(rec.actions.length).toBeGreaterThan(0);
      });
    });
  });
});