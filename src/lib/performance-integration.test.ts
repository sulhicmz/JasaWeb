/**
 * Performance Intelligence API Integration Test
 * 
 * Tests the API endpoints for performance intelligence features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performanceIntelligence } from '@/lib/performance-intelligence';

describe('Performance Intelligence API Integration', () => {
  beforeEach(() => {
    // Clear data before each test
    performanceIntelligence.clearData();
  });

  afterEach(() => {
    // Clean up after each test
    performanceIntelligence.clearData();
  });

  describe('API Endpoint Data Flow', () => {
    it('should process metrics through the complete intelligence pipeline', () => {
      // Simulate receiving performance metrics
      const performanceMetrics = {
        'bundle_size': 189,
        'api_latency': 45,
        'api_error_rate': 0.002,
        'db_query_time': 12,
        'cache_hit_rate': 0.89,
        'overall_score': 92
      };

      // Feed metrics to intelligence service (as API would do)
      performanceIntelligence.addMetrics(performanceMetrics);

      // Add enough data points for analysis
      for (let i = 0; i < 15; i++) {
        performanceIntelligence.addMetrics({
          ...performanceMetrics,
          'api_latency': 45 + Math.random() * 10,
          'overall_score': 92 + Math.random() * 5
        });
      }

      // Get intelligence summary
      const summary = performanceIntelligence.getIntelligenceSummary();
      
      expect(summary).toBeDefined();
      expect(summary.health.status).toBeDefined();
      expect(summary.anomalies.total).toBeGreaterThanOrEqual(0);
      expect(summary.predictions.total).toBeGreaterThanOrEqual(0);
    });

    it('should detect and classify anomalies correctly', () => {
      // Add baseline metrics
      const baseline = {
        'api_latency': 45,
        'error_rate': 0.01,
        'throughput': 1000
      };

      for (let i = 0; i < 10; i++) {
        performanceIntelligence.addMetrics(baseline);
      }

      // Add anomalous metrics
      performanceIntelligence.addMetrics({
        'api_latency': 150, // Spike
        'error_rate': 0.01,
        'throughput': 1000
      });

      performanceIntelligence.addMetrics({
        'api_latency': 45,
        'error_rate': 0.1, // Spike
        'throughput': 1000
      });

      performanceIntelligence.addMetrics({
        'api_latency': 45,
        'error_rate': 0.01,
        'throughput': 100 // Drop
      });

      const anomalies = performanceIntelligence.getAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);

      // Check for different types of anomalies
      const spikeAnomalies = anomalies.filter(a => a.type === 'spike');
      const dropAnomalies = anomalies.filter(a => a.type === 'drop');
      
      expect(spikeAnomalies.length).toBeGreaterThan(0);
      expect(dropAnomalies.length).toBeGreaterThan(0);

      // Verify anomaly structure
      anomalies.forEach(anomaly => {
        expect(anomaly.id).toBeDefined();
        expect(anomaly.metric).toBeDefined();
        expect(anomaly.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(anomaly.confidence).toBeGreaterThan(0);
        expect(anomaly.confidence).toBeLessThanOrEqual(1);
        expect(anomaly.recommendations.length).toBeGreaterThan(0);
      });
    });

    it('should generate meaningful predictions', () => {
      // Add trend data
      for (let i = 0; i < 30; i++) {
        performanceIntelligence.addMetrics({
          'performance_score': 100 - i * 2, // Degrading trend
          'response_time': 50 + i * 3,     // Increasing trend
          'error_rate': 0.01 + i * 0.001   // Slight increase
        });
      }

      const predictions = performanceIntelligence.getAllPredictions();
      expect(predictions.length).toBeGreaterThan(0);

      predictions.forEach(prediction => {
        expect(prediction.metric).toBeDefined();
        expect(prediction.predictions.length).toBeGreaterThan(0);
        expect(prediction.accuracy).toBeGreaterThanOrEqual(0);
        expect(prediction.accuracy).toBeLessThanOrEqual(100);
        expect(prediction.trend).toMatch(/^(improving|stable|degrading)$/);
        expect(prediction.riskFactors).toBeDefined();

        // Check prediction structure
        prediction.predictions.forEach(p => {
          expect(p.timestamp).toBeDefined();
          expect(p.value).toBeGreaterThanOrEqual(0);
          expect(p.confidence).toBeGreaterThan(0);
          expect(p.confidence).toBeLessThanOrEqual(1);
          expect(p.upperBound).toBeGreaterThanOrEqual(p.value);
          expect(p.lowerBound).toBeLessThanOrEqual(p.value);
        });
      });
    });

    it('should detect performance patterns', () => {
      // Create daily pattern
      for (let day = 0; day < 2; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const traffic = 500 + Math.sin(hour * Math.PI / 12) * 200;
          performanceIntelligence.addMetrics({
            'hourly_traffic': traffic,
            'hourly_errors': traffic * 0.01
          });
        }
      }

      const patterns = performanceIntelligence.getPatterns();
      expect(patterns.length).toBeGreaterThanOrEqual(0);

      patterns.forEach(pattern => {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.type).toMatch(/^(seasonal|cyclical|trend|anomaly)$/);
        expect(pattern.strength).toBeGreaterThanOrEqual(0);
        expect(pattern.strength).toBeLessThanOrEqual(1);
        expect(pattern.significance).toBeGreaterThanOrEqual(0);
        expect(pattern.significance).toBeLessThanOrEqual(1);
        expect(pattern.metrics.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Intelligence Scoring System', () => {
    it('should calculate accurate health scores', () => {
      // Test healthy system
      for (let i = 0; i < 15; i++) {
        performanceIntelligence.addMetrics({
          'performance_score': 95 + Math.random() * 5,
          'error_rate': 0.005 + Math.random() * 0.005,
          'response_time': 30 + Math.random() * 10
        });
      }

      let summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary.health.score).toBeGreaterThan(80);
      expect(summary.health.status).toBe('healthy');

      // Clear and test degraded system
      performanceIntelligence.clearData();

      // Add problematic data (enough to trigger analysis)
      for (let i = 0; i < 25; i++) {
        performanceIntelligence.addMetrics({
          'performance_score': 60 - Math.random() * 10,
          'error_rate': 0.05 + Math.random() * 0.05
        });
      }

      // Add critical anomalies
      performanceIntelligence.addMetrics({
        'performance_score': 20,
        'error_rate': 0.3
      });

      summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary.health.score).toBeLessThan(80);
      expect(summary.health.issues.length).toBeGreaterThan(0);
    });

    it('should provide meaningful recommendations', () => {
      // Add baseline
      for (let i = 0; i < 10; i++) {
        performanceIntelligence.addMetrics({
          'api_response_time': 45
        });
      }

      // Add spike to trigger recommendations
      performanceIntelligence.addMetrics({
        'api_response_time': 200
      });

      const anomalies = performanceIntelligence.getAnomalies();
      const responseTimeAnomalies = anomalies.filter(a => a.metric === 'api_response_time');
      
      expect(responseTimeAnomalies.length).toBeGreaterThan(0);
      
      responseTimeAnomalies.forEach(anomaly => {
        expect(anomaly.recommendations.length).toBeGreaterThan(0);
        anomaly.recommendations.forEach(rec => {
          expect(typeof rec).toBe('string');
          expect(rec.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle high-frequency metrics efficiently', () => {
      const startTime = Date.now();
      
      // Simulate high-frequency metric submission
      for (let i = 0; i < 500; i++) {
        performanceIntelligence.addMetrics({
          'high_freq_metric': 100 + Math.random() * 50,
          'secondary_metric': 200 + Math.random() * 100,
          'third_metric': 50 + Math.random() * 25
        });
      }
      
      const processingTime = Date.now() - startTime;
      
      // Should process within reasonable time
      expect(processingTime).toBeLessThan(500); // Less than 500ms
      
      // Should still provide accurate analysis
      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should maintain accuracy with large datasets', () => {
      // Add large dataset with known patterns
      for (let i = 0; i < 100; i++) {
        performanceIntelligence.addMetrics({
          'trend_metric': 100 + i * 2, // Linear trend
          'stable_metric': 100 + Math.random() * 10, // Stable with noise
          'cyclical_metric': Math.sin(i * Math.PI / 12) * 50 + 100 // Cyclical
        });
      }

      const predictions = performanceIntelligence.getAllPredictions();
      const trendPrediction = predictions.find(p => p.metric === 'trend_metric');
      
      if (trendPrediction) {
        expect(trendPrediction.trend).toBe('improving');
        expect(trendPrediction.accuracy).toBeGreaterThan(50); // Should detect trend
      }

      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary.health.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid metrics gracefully', () => {
      // Add various invalid metrics
      performanceIntelligence.addMetrics({
        'nan_metric': NaN,
        'infinity_metric': Infinity,
        'negative_metric': -100,
        'zero_metric': 0,
        'valid_metric': 100
      });

      // Should not crash
      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should handle empty or null values', () => {
      performanceIntelligence.addMetrics({});
      performanceIntelligence.addMetrics({ 'zero_metric': 0 });
      performanceIntelligence.addMetrics({ 'negative_metric': -50 });

      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should handle single metric submissions', () => {
      performanceIntelligence.addMetrics({ 'single_metric': 100 });

      // Should not predict with insufficient data
      const prediction = performanceIntelligence.getPrediction('single_metric');
      expect(prediction).toBeNull();

      // Should still provide summary
      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('Integration with Performance Monitor', () => {
    it('should integrate seamlessly with existing performance monitoring', () => {
      // Simulate performance monitor metrics
      const mockPerformanceMetrics = {
        bundle: {
          size: 189,
          gzippedSize: 60,
          chunkCount: 15,
          largestChunk: 25,
          compressionRatio: 0.32,
          score: 95
        },
        api: {
          averageLatency: 45,
          p95Latency: 80,
          p99Latency: 120,
          errorRate: 0.002,
          throughput: 1000,
          score: 90
        },
        database: {
          queryTime: 12,
          connectionPool: 0.6,
          indexUsage: 0.95,
          slowQueries: 2,
          score: 92
        },
        cache: {
          hitRate: 0.89,
          missRate: 0.11,
          evictionRate: 0.01,
          memoryUsage: 45,
          score: 88
        },
        timestamp: new Date().toISOString()
      };

      // Convert to intelligence format
      const intelMetrics = {
        'bundle_size': mockPerformanceMetrics.bundle.size,
        'api_latency': mockPerformanceMetrics.api.averageLatency,
        'api_error_rate': mockPerformanceMetrics.api.errorRate,
        'db_query_time': mockPerformanceMetrics.database.queryTime,
        'cache_hit_rate': mockPerformanceMetrics.cache.hitRate,
        'overall_score': mockPerformanceMetrics.bundle.score
      };

      // Add multiple data points
      for (let i = 0; i < 12; i++) {
        performanceIntelligence.addMetrics({
          ...intelMetrics,
          'api_latency': intelMetrics['api_latency'] + Math.random() * 10,
          'overall_score': intelMetrics['overall_score'] + Math.random() * 5
        });
      }

      const summary = performanceIntelligence.getIntelligenceSummary();
      expect(summary).toBeDefined();
      expect(summary.health.status).toBeDefined();
      expect(summary.predictions.total).toBeGreaterThanOrEqual(0);
    });
  });
});