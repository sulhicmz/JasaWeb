/**
 * Performance Optimization Service Tests
 * 
 * Comprehensive test coverage for autonomous performance optimization
 * engine with intelligent caching and predictive scaling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { KVNamespace } from '@/lib/types';
import { createPerformanceOptimizationService } from './PerformanceOptimizationService';
import type { PerformanceAnomaly } from '@/lib/performance-intelligence';

// Mock dependencies
const getLatestMetricsMock = vi.fn();
const generateRecommendationsMock = vi.fn();
const getAnomaliesMock = vi.fn();
const getPredictionMock = vi.fn();
const getAllPredictionsMock = vi.fn();
const cacheSetMock = vi.fn();

vi.mock('@/lib/performance-monitor', () => ({
  performanceMonitor: {
    getLatestMetrics: getLatestMetricsMock,
    generateRecommendations: generateRecommendationsMock,
  },
}));

vi.mock('@/lib/performance-intelligence', () => ({
  performanceIntelligence: {
    getAnomalies: getAnomaliesMock,
    getPrediction: getPredictionMock,
    getAllPredictions: getAllPredictionsMock,
  },
}));

vi.mock('@/lib/kv', () => ({
  cacheSet: cacheSetMock,
}));

describe('PerformanceOptimizationService', () => {
  let service: ReturnType<typeof createPerformanceOptimizationService>;
  let mockKv: KVNamespace;

  beforeEach(() => {
    // Mock KV namespace
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    } as unknown as KVNamespace;

    service = createPerformanceOptimizationService(mockKv);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.stopOptimization();
  });

  describe('Service Initialization', () => {
    it('should initialize with default strategies', () => {
      const strategies = service.getStrategies();
      
      expect(strategies).toHaveLength(4);
      expect(strategies.map(s => s.id)).toEqual([
        'db-query-optimize',
        'cache-optimization',
        'bundle-optimization',
        'predictive-scaling'
      ]);
    });

    it('should initialize without KV namespace', () => {
      const serviceWithoutKv = createPerformanceOptimizationService();
      expect(serviceWithoutKv).toBeDefined();
    });

    it('should have correct initial cache configuration', () => {
      const summary = service.getOptimizationSummary();
      
      expect(summary.recommendations.automated).toBeGreaterThan(0);
      expect(summary.recommendations.manual).toBeGreaterThan(0);
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
        expectedImpact: {
          performance: 10,
          resource: 5,
          reliability: 5
        },
        confidence: 0.8
      };

      service.addStrategy(newStrategy);
      const strategies = service.getStrategies();
      
      expect(strategies).toHaveLength(5);
      expect(strategies.find(s => s.id === 'test-strategy')).toBeDefined();
    });

    it('should remove optimization strategy', () => {
      const strategies = service.getStrategies();
      const initialCount = strategies.length;
      
      service.removeStrategy('db-query-optimize');
      const updatedStrategies = service.getStrategies();
      
      expect(updatedStrategies).toHaveLength(initialCount - 1);
      expect(updatedStrategies.find(s => s.id === 'db-query-optimize')).toBeUndefined();
    });
  });

  describe('Bottleneck Detection', () => {
    beforeEach(() => {
      getLatestMetricsMock.mockReturnValue({
        database: { queryTime: 60, indexUsage: 80, slowQueries: 15 },
        cache: { hitRate: 0.75, memoryUsage: 85, evictionRate: 0.25 },
        api: { averageLatency: 120, p95Latency: 200, errorRate: 0.02, throughput: 80 },
        bundle: { size: 250, largestChunk: 60, compressionRatio: 0.3 },
        timestamp: new Date().toISOString()
      });
    });

    it('should detect database bottlenecks', async () => {
      await (service as any).detectBottlenecks();
      const bottlenecks = service.getBottlenecks({ type: 'database' });
      
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].type).toBe('database');
      expect(bottlenecks[0].severity).toBe('high');
    });

    it('should detect cache bottlenecks', async () => {
      await (service as any).detectBottlenecks();
      const bottlenecks = service.getBottlenecks({ type: 'cache' });
      
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].type).toBe('cache');
    });

    it('should detect API bottlenecks', async () => {
      await (service as any).detectBottlenecks();
      const bottlenecks = service.getBottlenecks({ type: 'api' });
      
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].type).toBe('api');
    });

    it('should resolve bottlenecks', async () => {
      await (service as any).detectBottlenecks();
      const bottlenecks = service.getBottlenecks();
      const bottleneckId = bottlenecks[0]?.id;
      
      if (bottleneckId) {
        service.resolveBottleneck(bottleneckId);
        const resolved = service.getBottlenecks({ resolved: true });
        expect(resolved.find((b: any) => b.id === bottleneckId)?.resolved).toBe(true);
      }
    });
  });

  describe('Cache Optimization', () => {
    it('should execute cache optimization actions', async () => {
      cacheSetMock.mockResolvedValue(undefined);

      await (service as any).executeCacheOptimization({
        adaptiveTTL: true,
        intelligentEviction: true,
        compressionEnabled: true
      });

      expect(cacheSetMock).toHaveBeenCalledTimes(3);
      expect(cacheSetMock).toHaveBeenCalledWith(
        mockKv,
        'config:cache:adaptive_ttl',
        'true',
        { ttl: 3600 }
      );
    });

    it('should handle missing KV namespace gracefully', async () => {
      const serviceWithoutKv = createPerformanceOptimizationService();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await (serviceWithoutKv as any).executeCacheOptimization({
        adaptiveTTL: true
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('KV namespace not available')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Bundle Optimization', () => {
    it('should store bundle optimization configuration', async () => {
      cacheSetMock.mockResolvedValue(undefined);

      const parameters = { codeSplitting: true, lazyLoading: true };
      await (service as any).executeBundleOptimization(parameters);

      expect(cacheSetMock).toHaveBeenCalledWith(
        mockKv,
        'config:bundle:optimization',
        JSON.stringify(parameters),
        { ttl: 3600 }
      );
    });
  });

  describe('Scaling Recommendations', () => {
    beforeEach(() => {
      getLatestMetricsMock.mockReturnValue({
        database: { queryTime: 40, indexUsage: 85, slowQueries: 5 },
        cache: { hitRate: 0.9, memoryUsage: 95, evictionRate: 0.1 },
        api: { averageLatency: 80, p95Latency: 150, errorRate: 0.005, throughput: 120 },
        bundle: { size: 180, largestChunk: 40, compressionRatio: 0.4 },
        timestamp: new Date().toISOString()
      });

      getAllPredictionsMock.mockReturnValue([{
        metric: 'database.queryTime',
        predictions: [{
          value: 60,
          confidence: 0.8
        }]
      }]);
    });

    it('should generate database scaling recommendations', async () => {
      await (service as any).generateScalingRecommendations();
      const recommendations = service.getScalingRecommendations();

      const dbRecommendations = recommendations.filter(r => r.resourceType === 'database');
      expect(dbRecommendations.length).toBeGreaterThan(0);
      expect(dbRecommendations[0].recommendedCapacity).toBeGreaterThan(100);
    });

    it('should generate cache scaling recommendations', async () => {
      await (service as any).generateScalingRecommendations();
      const recommendations = service.getScalingRecommendations();

      const cacheRecommendations = recommendations.filter(r => r.resourceType === 'cache');
      expect(cacheRecommendations.length).toBeGreaterThan(0);
      expect(cacheRecommendations[0].reasoning).toContain('memory usage');
    });
  });

  describe('Optimization Cycle', () => {
    beforeEach(() => {
      getLatestMetricsMock.mockReturnValue({
        database: { queryTime: 25, indexUsage: 90, slowQueries: 2 },
        cache: { hitRate: 0.9, memoryUsage: 60, evictionRate: 0.05 },
        api: { averageLatency: 60, p95Latency: 100, errorRate: 0.005, throughput: 150 },
        bundle: { size: 150, largestChunk: 30, compressionRatio: 0.5 },
        timestamp: new Date().toISOString()
      });

      getAnomaliesMock.mockReturnValue([]);
      getAllPredictionsMock.mockReturnValue([]);
    });

    it('should run complete optimization cycle', async () => {
      const detectBottlenecksSpy = vi.spyOn(service as any, 'detectBottlenecks');
      const generateRecommendationsSpy = vi.spyOn(service as any, 'generateScalingRecommendations');

      await (service as any).runOptimizationCycle();

      expect(detectBottlenecksSpy).toHaveBeenCalled();
      expect(generateRecommendationsSpy).toHaveBeenCalled();
    }, 10000);

    it('should handle optimization cycle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const detectBottlenecksSpy = vi.spyOn(service as any, 'detectBottlenecks');
      detectBottlenecksSpy.mockRejectedValue(new Error('Test error'));

      await (service as any).runOptimizationCycle();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in optimization cycle'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop optimization engine', () => {
      expect(() => service.startOptimization()).not.toThrow();
      expect(() => service.stopOptimization()).not.toThrow();
    });

    it('should handle multiple start calls gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.startOptimization();
      service.startOptimization(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already running')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Optimization Summary', () => {
    it('should provide comprehensive optimization summary', () => {
      const summary = service.getOptimizationSummary();

      expect(summary).toHaveProperty('strategies');
      expect(summary).toHaveProperty('bottlenecks');
      expect(summary).toHaveProperty('recommendations');
      expect(summary).toHaveProperty('performance');

      expect(summary.strategies.total).toBe(4);
      expect(summary.strategies.pending).toBe(4);
      expect(summary.bottlenecks.total).toBe(0);
    });
  });

  describe('Strategy Evaluation', () => {
    it('should evaluate strategy conditions correctly', async () => {
      getLatestMetricsMock.mockReturnValue({
        database: { queryTime: 60, indexUsage: 80, slowQueries: 5 },
        cache: { hitRate: 0.75, memoryUsage: 85, evictionRate: 0.1 },
        api: { averageLatency: 60, p95Latency: 100, errorRate: 0.005, throughput: 150 },
        bundle: { size: 150, largestChunk: 30, compressionRatio: 0.5 },
        timestamp: new Date().toISOString()
      });

      getPredictionMock.mockReturnValue({
        trend: 'increasing'
      });

      const strategies = await (service as any).evaluateStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0]).toHaveProperty('id');
      expect(strategies[0]).toHaveProperty('priority');
    });

    it('should skip already implemented successful strategies', async () => {
      const strategies = service.getStrategies();
      const strategy = strategies[0];
      
      // Mark strategy as successfully implemented
      strategy.results = {
        executedAt: new Date().toISOString(),
        metrics: {} as any,
        impact: { performance: 10, resource: 5, reliability: 5 },
        success: true
      };

      const evaluatedStrategies = await (service as any).evaluateStrategies();
      
      expect(evaluatedStrategies.find((s: any) => s.id === strategy.id)).toBeUndefined();
    });
  });

  describe('Impact Calculation', () => {
    it('should calculate optimization impact correctly', () => {
      const beforeMetrics = {
        api: { averageLatency: 100, p95Latency: 150, errorRate: 0.01, throughput: 100, score: 80 },
        database: { queryTime: 50, indexUsage: 85, slowQueries: 5, score: 85 },
        cache: { hitRate: 0.8, memoryUsage: 70, evictionRate: 0.1, score: 80 },
        bundle: { size: 200, largestChunk: 50, compressionRatio: 0.4, score: 85 },
        timestamp: new Date().toISOString()
      };

      const afterMetrics = {
        api: { averageLatency: 80, p95Latency: 120, errorRate: 0.005, throughput: 120, score: 85 },
        database: { queryTime: 40, indexUsage: 90, slowQueries: 2, score: 90 },
        cache: { hitRate: 0.85, memoryUsage: 60, evictionRate: 0.05, score: 85 },
        bundle: { size: 180, largestChunk: 40, compressionRatio: 0.45, score: 90 },
        timestamp: new Date().toISOString()
      };

      const impact = (service as any).calculateImpact(beforeMetrics, afterMetrics);

      expect(impact.performance).toBeGreaterThan(0);
      expect(impact.resource).toBeGreaterThan(0);
      expect(impact.reliability).toBeGreaterThan(0);
    });
  });

  describe('Root Cause Analysis', () => {
    it('should analyze database root causes correctly', () => {
      const database = { queryTime: 60, indexUsage: 75, slowQueries: 15 };
      const anomalies: PerformanceAnomaly[] = [];

      const rootCause = (service as any).analyzeDatabaseRootCause(database, anomalies);

      expect(rootCause).toContain('slow queries');
    });

    it('should analyze cache root causes correctly', () => {
      const cache = { hitRate: 0.7, memoryUsage: 95, evictionRate: 0.3 };
      const anomalies: PerformanceAnomaly[] = [];

      const rootCause = (service as any).analyzeCacheRootCause(cache, anomalies);

      expect(rootCause).toContain('eviction');
    });

    it('should analyze API root causes correctly', () => {
      const api = { averageLatency: 150, p95Latency: 200, errorRate: 0.02, throughput: 80 };
      const anomalies: PerformanceAnomaly[] = [];

      const rootCause = (service as any).analyzeApiRootCause(api, anomalies);

      const hasErrorRate = rootCause.includes('error rate');
      const hasThroughput = rootCause.includes('throughput');
      expect(hasErrorRate || hasThroughput).toBe(true);
    });
  });
});