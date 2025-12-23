/**
 * Performance Intelligence Service Test Suite
 * 
 * Comprehensive testing for ML-based anomaly detection, 
 * predictive analytics, and pattern detection features.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  PerformanceIntelligenceService, 
  createPerformanceIntelligenceService
} from '@/lib/performance-intelligence';

describe('PerformanceIntelligenceService', () => {
  let service: PerformanceIntelligenceService;

  beforeEach(() => {
    service = createPerformanceIntelligenceService({
      anomalyDetection: {
        sensitivity: 0.8,
        minDataPoints: 5, // Reduced for testing
        windowSize: 20,
        alertThreshold: 2.0
      },
      prediction: {
        algorithm: 'linear',
        lookbackPeriod: 10, // Reduced for testing
        confidenceThreshold: 0.7,
        updateFrequency: 1
      },
      patterns: {
        minPatternLength: 10, // Reduced for testing
        significanceThreshold: 0.8
      }
    });
  });

  afterEach(() => {
    service.clearData();
  });

  describe('Data Ingestion', () => {
    it('should add metrics successfully', () => {
      const metrics = {
        'api_latency': 45,
        'error_rate': 0.01,
        'throughput': 1000
      };

      service.addMetrics(metrics);

      // No errors should be thrown
      expect(true).toBe(true);
    });

    it('should handle multiple metric additions', () => {
      const metrics1 = { 'api_latency': 45 };
      const metrics2 = { 'api_latency': 50, 'error_rate': 0.02 };

      service.addMetrics(metrics1);
      service.addMetrics(metrics2);

      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should maintain data within memory limits', () => {
      const metrics = { 'test_metric': 100 };

      // Add more than the limit
      for (let i = 0; i < 1050; i++) {
        service.addMetrics({ 
          ...metrics,
          'iteration': i 
        });
      }

      // Should not throw and should maintain reasonable memory usage
      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect spike anomalies', () => {
      // Add normal metrics
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'api_latency': 45 + Math.random() * 5  // 45-50ms range
        });
      }

      // Add a spike
      service.addMetrics({
        'api_latency': 150  // Significant spike
      });

      const anomalies = service.getAnomalies();
      const spikeAnomalies = anomalies.filter(a => a.type === 'spike');
      
      expect(spikeAnomalies.length).toBeGreaterThan(0);
      expect(spikeAnomalies[0].metric).toBe('api_latency');
      expect(spikeAnomalies[0].severity).toBeDefined();
    });

    it('should detect drop anomalies', () => {
      // Add normal metrics
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'throughput': 1000 + Math.random() * 100  // 1000-1100 range
        });
      }

      // Add a drop
      service.addMetrics({
        'throughput': 200  // Significant drop
      });

      const anomalies = service.getAnomalies();
      const dropAnomalies = anomalies.filter(a => a.type === 'drop');
      
      expect(dropAnomalies.length).toBeGreaterThan(0);
      expect(dropAnomalies[0].metric).toBe('throughput');
    });

    it('should provide anomaly confidence scores', () => {
      // Add baseline metrics
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'test_metric': 100
        });
      }

      // Add anomaly
      service.addMetrics({
        'test_metric': 200  // 100% increase
      });

      const anomalies = service.getAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      
      const anomaly = anomalies[0];
      expect(anomaly.confidence).toBeGreaterThan(0);
      expect(anomaly.confidence).toBeLessThanOrEqual(1);
    });

    it('should filter anomalies by severity', () => {
      // Add various anomalies
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'test_metric': 100
        });
      }
      
      // Add anomalies of different severities
      service.addMetrics({ 'test_metric': 150 }); // medium
      service.addMetrics({ 'test_metric': 250 }); // critical
      service.addMetrics({ 'test_metric': 30 });  // medium drop

      const criticalAnomalies = service.getAnomalies({ severity: 'critical' });
      const mediumAnomalies = service.getAnomalies({ severity: 'medium' });

      expect(criticalAnomalies.length).toBeGreaterThan(0);
      expect(mediumAnomalies.length).toBeGreaterThan(0);
    });

    it('should filter anomalies by time range', () => {
      const pastTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      
      // Add metrics at different times
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'test_metric': 100
        }, pastTimestamp);
      }

      // Add recent anomaly
      service.addMetrics({
        'test_metric': 200
      });

      const recentAnomalies = service.getAnomalies({ timeRange: 1 }); // Last hour
      const allAnomalies = service.getAnomalies();

      expect(recentAnomalies.length).toBeLessThanOrEqual(allAnomalies.length);
    });
  });

  describe('Predictive Analytics', () => {
    it('should generate predictions for sufficient data', () => {
      // Add sufficient data points
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'api_latency': 45 + i * 2  // Upward trend
        });
      }

      const prediction = service.getPrediction('api_latency');
      expect(prediction).toBeDefined();
      expect(prediction?.metric).toBe('api_latency');
      expect(prediction?.predictions.length).toBeGreaterThan(0);
      expect(prediction?.trend).toBe('improving');
    });

    it('should return null for insufficient data', () => {
      service.addMetrics({ 'test_metric': 100 });

      const prediction = service.getPrediction('test_metric');
      expect(prediction).toBeNull();
    });

    it('should provide confidence bounds', () => {
      // Add trend data
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'test_metric': 100 + i * 5
        });
      }

      const prediction = service.getPrediction('test_metric');
      expect(prediction).toBeDefined();
      
      const firstPrediction = prediction!.predictions[0];
      expect(firstPrediction.upperBound).toBeGreaterThan(firstPrediction.value);
      expect(firstPrediction.lowerBound).toBeLessThan(firstPrediction.value);
      expect(firstPrediction.confidence).toBeGreaterThan(0);
    });

    it('should detect degrading trends', () => {
      // Add downward trend
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'performance_score': 100 - i * 2  // Decreasing
        });
      }

      const prediction = service.getPrediction('performance_score');
      expect(prediction?.trend).toBe('degrading');
    });

    it('should identify risk factors', () => {
      // Add volatile data
      for (let i = 0; i < 20; i++) {
        service.addMetrics({
          'unstable_metric': 100 + Math.random() * 100 - 50  // High variance
        });
      }

      const prediction = service.getPrediction('unstable_metric');
      expect(prediction?.riskFactors.length).toBeGreaterThan(0);
    });

    it('should calculate prediction accuracy', () => {
      // Add linear trend data
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'linear_metric': 50 + i * 3
        });
      }

      const prediction = service.getPrediction('linear_metric');
      expect(prediction?.accuracy).toBeGreaterThan(0);
      expect(prediction?.accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect seasonal patterns', () => {
      // Create daily pattern data
      for (let day = 0; day < 3; day++) {
        for (let hour = 0; hour < 24; hour++) {
          service.addMetrics({
            'daily_traffic': Math.sin(hour * Math.PI / 12) * 100 + 500  // Daily sine wave
          });
        }
      }

      const patterns = service.getPatterns({ type: 'seasonal' });
      const seasonalPatterns = patterns.filter(p => p.type === 'seasonal');
      
      expect(seasonalPatterns.length).toBeGreaterThan(0);
      expect(seasonalPatterns[0].periodicity).toBe('daily');
    });

    it('should filter patterns by metric', () => {
      // Add pattern data for multiple metrics
      for (let i = 0; i < 30; i++) {
        service.addMetrics({
          'metric_a': Math.sin(i * Math.PI / 12) * 50 + 100,
          'metric_b': Math.cos(i * Math.PI / 12) * 30 + 200
        });
      }

      const patternsA = service.getPatterns({ metric: 'metric_a' });
      const patternsB = service.getPatterns({ metric: 'metric_b' });

      expect(patternsA.length).toBeGreaterThan(0);
      expect(patternsB.length).toBeGreaterThan(0);
      
      // Each should only contain patterns for its metric
      patternsA.forEach(p => {
        expect(p.metrics).toContain('metric_a');
      });
      
      patternsB.forEach(p => {
        expect(p.metrics).toContain('metric_b');
      });
    });

    it('should calculate pattern significance', () => {
      // Add strong pattern data
      for (let i = 0; i < 40; i++) {
        service.addMetrics({
          'strong_pattern': Math.sin(i * Math.PI / 6) * 100  // Strong pattern
        });
      }

      const patterns = service.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      
      const strongPattern = patterns.find(p => p.metrics.includes('strong_pattern'));
      expect(strongPattern?.significance).toBeGreaterThan(0.8);
    });
  });

  describe('Intelligence Summary', () => {
    it('should provide comprehensive summary', () => {
      // Add diverse data
      for (let i = 0; i < 20; i++) {
        service.addMetrics({
          'api_latency': 45 + Math.random() * 10,
          'error_rate': 0.01 + Math.random() * 0.005,
          'throughput': 1000 + Math.random() * 100
        });
      }

      // Add anomalies
      service.addMetrics({ 'api_latency': 150 });
      service.addMetrics({ 'error_rate': 0.1 });

      const summary = service.getIntelligenceSummary();
      
      expect(summary.anomalies.total).toBeGreaterThan(0);
      expect(summary.anomalies.critical).toBeDefined();
      expect(summary.predictions.total).toBeGreaterThanOrEqual(0);
      expect(summary.patterns.total).toBeGreaterThanOrEqual(0);
      expect(summary.health.status).toBeDefined();
      expect(summary.health.score).toBeGreaterThanOrEqual(0);
      expect(summary.health.score).toBeLessThanOrEqual(100);
    });

    it('should calculate health score correctly', () => {
      // Add good data
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'performance_score': 95 + Math.random() * 5  // Consistently good
        });
      }

      const summary = service.getIntelligenceSummary();
      expect(summary.health.score).toBeGreaterThan(80);
      expect(summary.health.status).toBe('healthy');
    });

    it('should detect health issues', () => {
      // Add problematic data
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'error_rate': 0.01
        });
      }
      
      // Add multiple critical anomalies
      for (let i = 0; i < 3; i++) {
        service.addMetrics({
          'error_rate': 0.5  // Critical spike
        });
      }

      const summary = service.getIntelligenceSummary();
      expect(summary.health.score).toBeLessThan(80);
      expect(summary.health.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should respect custom configuration', () => {
      const customService = createPerformanceIntelligenceService({
        anomalyDetection: {
          sensitivity: 0.5,
          minDataPoints: 3,
          windowSize: 10,
          alertThreshold: 1.5
        },
        prediction: {
          algorithm: 'linear',
          lookbackPeriod: 5,
          confidenceThreshold: 0.6,
          updateFrequency: 1
        },
        patterns: {
          minPatternLength: 8,
          significanceThreshold: 0.7
        }
      });

      // Add minimal data to trigger analysis
      for (let i = 0; i < 5; i++) {
        customService.addMetrics({
          'test_metric': 100
        });
      }

      // Should work with custom config
      const summary = customService.getIntelligenceSummary();
      expect(summary).toBeDefined();

      customService.clearData();
    });

    it('should handle default configuration', () => {
      const defaultService = createPerformanceIntelligenceService();
      
      defaultService.addMetrics({
        'test_metric': 100
      });

      const summary = defaultService.getIntelligenceSummary();
      expect(summary).toBeDefined();

      defaultService.clearData();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metrics gracefully', () => {
      service.addMetrics({});
      
      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should handle negative values', () => {
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'negative_metric': -50 - i * 10
        });
      }

      const prediction = service.getPrediction('negative_metric');
      if (prediction) {
        prediction.predictions.forEach(p => {
          expect(p.value).toBeGreaterThanOrEqual(0); // Non-negative predictions
        });
      }
    });

    it('should handle zero values', () => {
      for (let i = 0; i < 10; i++) {
        service.addMetrics({
          'zero_metric': 0
        });
      }

      const anomalies = service.getAnomalies({ metric: 'zero_metric' });
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should handle NaN and Infinity', () => {
      service.addMetrics({
        'nan_metric': NaN,
        'inf_metric': Infinity,
        'normal_metric': 100
      });

      // Should not crash
      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      
      // Add large dataset
      for (let i = 0; i < 1000; i++) {
        service.addMetrics({
          'performance_metric': 100 + Math.random() * 50,
          'secondary_metric': 200 + Math.random() * 100
        });
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
      
      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
    });

    it('should maintain memory efficiency', () => {
      // Add data that exceeds memory limits
      for (let i = 0; i < 2000; i++) {
        service.addMetrics({
          'memory_test': i
        });
      }

      // Should still function correctly
      const summary = service.getIntelligenceSummary();
      expect(summary).toBeDefined();
      expect(summary.anomalies.total).toBeLessThan(2000); // Should be limited
    });
  });

  describe('Data Validation', () => {
    it('should validate prediction timeframe', () => {
      // Add sufficient data
      for (let i = 0; i < 15; i++) {
        service.addMetrics({
          'test_metric': 100 + i
        });
      }

      const prediction = service.getPrediction('test_metric');
      expect(prediction).toBeDefined();
      
      const timeframes = prediction!.predictions.map(p => {
        const futureTime = new Date(p.timestamp).getTime();
        const now = new Date().getTime();
        const hoursDiff = (futureTime - now) / (1000 * 60 * 60);
        return hoursDiff;
      });

      // Should contain predictions for different timeframes
      expect(timeframes).toContain(1);   // 1 hour
      expect(timeframes).toContain(6);   // 6 hours
      expect(timeframes).toContain(24);  // 24 hours
      expect(timeframes).toContain(168); // 7 days
    });

    it('should provide consistent anomaly IDs', () => {
      // Add anomalies
      for (let i = 0; i < 5; i++) {
        service.addMetrics({ 'test_metric': 100 });
      }
      service.addMetrics({ 'test_metric': 200 });
      service.addMetrics({ 'test_metric': 50 });

      const anomalies = service.getAnomalies();
      const ids = anomalies.map(a => a.id);
      
      // All IDs should be unique
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ids.length);
      
      // IDs should follow expected format
      ids.forEach(id => {
        expect(id).toMatch(/^perf_/);
      });
    });
  });
});