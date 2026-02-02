/**
 * Performance Optimization Service Tests
 * 
 * Comprehensive test coverage for autonomous performance optimization
 * engine with intelligent caching and predictive scaling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { KVNamespace } from '@/lib/types';
import { createPerformanceOptimizationService } from './PerformanceOptimizationService';

// Mock dependencies - factories must not reference outer variables
vi.mock('@/lib/performance-monitoring', () => ({
  performanceMonitor: {
    getLatestMetrics: vi.fn(),
    generateRecommendations: vi.fn(),
  },
}));

vi.mock('@/lib/performance-intelligence', () => ({
  performanceIntelligence: {
    getAnomalies: vi.fn(),
    getPrediction: vi.fn(),
    getAllPredictions: vi.fn(),
  },
}));

// Import mocked modules to access mock functions
import { performanceMonitor } from '@/lib/performance-monitoring';
import { performanceIntelligence } from '@/lib/performance-intelligence';

describe('PerformanceOptimizationService', () => {
  let service: ReturnType<typeof createPerformanceOptimizationService>;
  let mockKv: KVNamespace;

  beforeEach(() => {
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    } as unknown as KVNamespace;

    service = createPerformanceOptimizationService(mockKv);
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.stopOptimization();
  });

  describe('Service Initialization', () => {
    it('should initialize with default strategies', () => {
      const strategies = service.getStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
    });

    it('should initialize without KV namespace', () => {
      const serviceWithoutKv = createPerformanceOptimizationService();
      expect(serviceWithoutKv).toBeDefined();
    });
  });

  describe('Strategy Management', () => {
    it('should add new optimization strategy', () => {
      const newStrategy = {
        id: 'test-strategy',
        name: 'Test Strategy',
        type: 'cache' as const,
        priority: 'medium' as const,
        description: 'Test optimization strategy',
        expectedImpact: { performance: 10, resource: 5, reliability: 0 },
        confidence: 0.8,
        conditions: [{
          metric: 'cache.hitRate',
          operator: '<' as const,
          threshold: 80
        }],
        actions: [{
          type: 'cache_config' as const,
          target: 'test',
          parameters: {},
          automated: true
        }],
      };

      service.addStrategy(newStrategy);
      
      const strategies = service.getStrategies();
      expect(strategies.some(s => s.id === 'test-strategy')).toBe(true);
    });

    it('should remove optimization strategy', () => {
      const initialCount = service.getStrategies().length;
      
      service.removeStrategy('bundle-optimization');
      
      const strategies = service.getStrategies();
      expect(strategies.length).toBe(initialCount - 1);
      expect(strategies.map(s => s.id)).not.toContain('bundle-optimization');
    });
  });

  describe('Bottleneck Detection', () => {
    it('should detect database bottlenecks', async () => {
      const metrics = {
        database: { queryTime: 150, indexUsage: 60, slowQueries: 25 },
        cache: { hitRate: 0.85, memoryUsage: 50 },
        api: { averageLatency: 80, errorRate: 0.01 },
        timestamp: new Date().toISOString()
      };

      (performanceMonitor.getLatestMetrics as any).mockReturnValue(metrics);
      (performanceIntelligence.getAnomalies as any).mockReturnValue([{
        metric: 'database.queryTime',
        severity: 'critical',
        value: 150,
        threshold: 100,
        timestamp: new Date().toISOString()
      }]);

      await (service as any).detectBottlenecks();
      const bottlenecks = service.getBottlenecks();

      expect(bottlenecks.length).toBeGreaterThan(0);
    });
  });

  describe('Scaling Recommendations', () => {
    beforeEach(() => {
      (performanceMonitor.getLatestMetrics as any).mockReturnValue({
        database: { queryTime: 40, indexUsage: 85, slowQueries: 5 },
        cache: { hitRate: 0.9, memoryUsage: 95, evictionRate: 0.1 },
        api: { averageLatency: 80, p95Latency: 150, errorRate: 0.005, throughput: 120 },
        timestamp: new Date().toISOString()
      });

      (performanceIntelligence.getAllPredictions as any).mockReturnValue([{
        metric: 'database.queryTime',
        predictions: [{ value: 60, confidence: 0.8 }]
      }]);
    });

    it('should generate scaling recommendations', async () => {
      await (service as any).generateScalingRecommendations();
      const recommendations = service.getScalingRecommendations();

      expect(recommendations).toBeDefined();
    });
  });

  describe('Optimization Cycle', () => {
    beforeEach(() => {
      (performanceMonitor.getLatestMetrics as any).mockReturnValue({
        bundle: { size: 189.71, gzippedSize: 60.75, chunkCount: 2, largestChunk: 120, compressionRatio: 0.32, score: 85 },
        database: { queryTime: 25, indexUsage: 90, slowQueries: 2, score: 95 },
        cache: { hitRate: 0.9, memoryUsage: 60, evictionRate: 0.05, score: 92 },
        api: { averageLatency: 60, p95Latency: 100, p99Latency: 120, errorRate: 0.005, throughput: 150, score: 88 },
        timestamp: new Date().toISOString()
      });

      (performanceIntelligence.getAnomalies as any).mockReturnValue([]);
      (performanceIntelligence.getAllPredictions as any).mockReturnValue([]);
    });

    it('should run optimization cycle', async () => {
      await (service as any).runOptimizationCycle();

      expect(performanceMonitor.getLatestMetrics).toHaveBeenCalled();
    });
  });

  describe('Automated Optimization', () => {
    it('should start and stop optimization', () => {
      service.startOptimization();
      
      expect((service as any).optimizationInterval).toBeDefined();

      service.stopOptimization();
      
      expect((service as any).optimizationInterval).toBeNull();
    });
  });

  describe('Optimization Summary', () => {
    it('should provide summary', () => {
      (performanceMonitor.getLatestMetrics as any).mockReturnValue({
        bundle: { score: 90 },
        api: { score: 85 },
        database: { score: 88 },
        cache: { score: 92 },
        timestamp: new Date().toISOString()
      });

      const summary = service.getOptimizationSummary();

      expect(summary).toHaveProperty('strategies');
      expect(summary).toHaveProperty('bottlenecks');
      expect(summary).toHaveProperty('recommendations');
    });
  });
});
