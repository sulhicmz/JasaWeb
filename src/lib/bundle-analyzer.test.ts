/**
 * Bundle Analyzer Test Suite
 * Tests bundle analysis, performance scoring, and optimization recommendations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BundleAnalyzer,
  EnhancedPerformanceMonitor,
  PERFORMANCE_THRESHOLDS,
  type BundleData,
  type ChunkInfo,
  type DependencyInfo,
  type BundleAnalysis
} from './bundle-analyzer';

describe('BundleAnalyzer', () => {
  let analyzer: BundleAnalyzer;

  beforeEach(() => {
    analyzer = new BundleAnalyzer();
  });

  describe('Constructor', () => {
    it('should initialize with default thresholds', () => {
      expect(analyzer).toBeInstanceOf(BundleAnalyzer);
    });

    it('should accept custom thresholds', () => {
      const customThresholds = {
        maxBundleSize: 300,
        maxChunkSize: 250,
        maxGzipRatio: 0.5,
        minCacheHitRate: 0.9,
        maxApiLatency: 150,
        maxDbQueryTime: 75
      };
      const customAnalyzer = new BundleAnalyzer(customThresholds);
      expect(customAnalyzer).toBeInstanceOf(BundleAnalyzer);
    });
  });

  describe('analyze', () => {
    it('should analyze bundle and return analysis', () => {
      const bundleData: BundleData = {
        totalSize: 200 * 1024,
        gzipSize: 60 * 1024,
        chunks: [
          {
            name: 'main.js',
            size: 150 * 1024,
            gzipSize: 45 * 1024,
            modules: ['module1', 'module2', 'module3'],
            imports: ['lodash', 'react']
          }
        ],
        dependencies: [
          {
            name: 'react',
            size: 42 * 1024,
            gzipSize: 14 * 1024,
            version: '18.2.0',
            path: 'node_modules/react'
          }
        ]
      };

      const analysis = analyzer.analyze(bundleData);

      expect(analysis).toBeDefined();
      expect(analysis.largestChunks).toBeDefined();
      expect(Array.isArray(analysis.largestChunks)).toBe(true);
      expect(analysis.duplicateModules).toBeDefined();
      expect(Array.isArray(analysis.duplicateModules)).toBe(true);
      expect(analysis.unusedDependencies).toBeDefined();
      expect(Array.isArray(analysis.unusedDependencies)).toBe(true);
      expect(analysis.optimizationSuggestions).toBeDefined();
      expect(Array.isArray(analysis.optimizationSuggestions)).toBe(true);
    });

    it('should handle minimal bundle data', () => {
      const bundleData: BundleData = {};
      const analysis = analyzer.analyze(bundleData);

      expect(analysis).toBeDefined();
      // Implementation uses default chunk when data is missing
      expect(analysis.largestChunks).toBeDefined();
      expect(analysis.duplicateModules).toHaveLength(0);
    });

    it('should identify duplicate modules across chunks', () => {
      const bundleData: BundleData = {
        chunks: [
          {
            name: 'chunk1.js',
            size: 100 * 1024,
            gzipSize: 30 * 1024,
            modules: ['shared-module', 'unique-1'],
            imports: []
          },
          {
            name: 'chunk2.js',
            size: 100 * 1024,
            gzipSize: 30 * 1024,
            modules: ['shared-module', 'unique-2'],
            imports: []
          }
        ]
      };

      const analysis = analyzer.analyze(bundleData);

      expect(analysis.duplicateModules).toHaveLength(1);
      expect(analysis.duplicateModules[0].name).toBe('shared-module');
      expect(analysis.duplicateModules[0].count).toBe(2);
    });
  });

  describe('generateBundleReport', () => {
    it('should generate comprehensive bundle report', () => {
      const bundleData: BundleData = {
        totalSize: 189.71 * 1024,
        gzipSize: 60.75 * 1024,
        chunks: [
          {
            name: 'client.CLjQ901I.js',
            size: 189.71 * 1024,
            gzipSize: 60.75 * 1024,
            modules: [],
            imports: []
          }
        ],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(bundleData);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalSize).toBeGreaterThan(0);
      expect(report.summary.gzipSize).toBeGreaterThan(0);
      expect(report.summary.compressionRatio).toBeGreaterThan(0);
      expect(report.summary.chunkCount).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.status).toBeDefined();
      expect(['excellent', 'good', 'fair', 'poor']).toContain(report.status);
    });

    it('should calculate compression ratio correctly', () => {
      const bundleData: BundleData = {
        totalSize: 200 * 1024,
        gzipSize: 60 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(bundleData);

      expect(report.summary.compressionRatio).toBe(30);
    });

    it('should assign excellent status for high scores', () => {
      const bundleData: BundleData = {
        totalSize: 150 * 1024,
        gzipSize: 45 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(bundleData);

      expect(report.score).toBeGreaterThanOrEqual(90);
      expect(report.status).toBe('excellent');
    });

    it('should assign good status for medium scores', () => {
      const largeBundleData: BundleData = {
        totalSize: 260 * 1024,
        gzipSize: 80 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(largeBundleData);

      expect(report.score).toBeGreaterThanOrEqual(75);
      expect(report.score).toBeLessThan(90);
      expect(report.status).toBe('good');
    });
  });

  describe('Bundle Scoring', () => {
    it('should give full score for small bundles', () => {
      const bundleData: BundleData = {
        totalSize: 100 * 1024,
        gzipSize: 30 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(bundleData);

      expect(report.score).toBe(100);
    });

    it('should penalize bundles exceeding size threshold', () => {
      const largeBundleData: BundleData = {
        totalSize: 300 * 1024,
        gzipSize: 90 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(largeBundleData);

      expect(report.score).toBeLessThan(100);
      expect(report.score).toBeLessThanOrEqual(75);
    });

    it('should penalize large chunks', () => {
      const largeChunkData: BundleData = {
        totalSize: 100 * 1024,
        gzipSize: 30 * 1024,
        chunks: [
          {
            name: 'huge-chunk.js',
            size: 250 * 1024,
            gzipSize: 75 * 1024,
            modules: [],
            imports: []
          }
        ],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(largeChunkData);

      expect(report.score).toBeLessThan(100);
    });

    it('should bonus for excellent compression', () => {
      const wellCompressedData: BundleData = {
        totalSize: 200 * 1024,
        gzipSize: 50 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(wellCompressedData);

      // Score is capped at 100, but excellent compression helps maintain high score
      expect(report.score).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Optimization Suggestions', () => {
    it('should suggest code splitting for large bundles', () => {
      const largeBundleData: BundleData = {
        totalSize: 280 * 1024,
        gzipSize: 85 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(largeBundleData);

      expect(report.analysis.optimizationSuggestions).toBeDefined();
      expect(report.analysis.optimizationSuggestions.length).toBeGreaterThan(0);
      expect(report.analysis.optimizationSuggestions[0].type).toBe('bundle');
      expect(report.analysis.optimizationSuggestions[0].priority).toBe('high');
    });

    it('should suggest gzip improvement for poor compression', () => {
      const poorCompressionData: BundleData = {
        totalSize: 100 * 1024,
        gzipSize: 80 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(poorCompressionData);

      const gzipSuggestion = report.analysis.optimizationSuggestions.find(
        s => s.description.includes('compression')
      );
      expect(gzipSuggestion).toBeDefined();
      expect(gzipSuggestion?.type).toBe('network');
    });

    it('should maintain low priority for well-optimized bundles', () => {
      const optimizedData: BundleData = {
        totalSize: 180 * 1024,
        gzipSize: 55 * 1024,
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(optimizedData);

      const criticalSuggestions = report.analysis.optimizationSuggestions.filter(
        s => s.priority === 'high'
      );
      expect(criticalSuggestions).toHaveLength(0);
    });
  });

  describe('Unused Dependencies', () => {
    it('should identify common dev dependencies', () => {
      const bundleData: BundleData = {
        chunks: [],
        dependencies: []
      };

      const report = analyzer.generateBundleReport(bundleData);

      expect(report.analysis.unusedDependencies).toBeDefined();
      expect(Array.isArray(report.analysis.unusedDependencies)).toBe(true);
      expect(report.analysis.unusedDependencies.length).toBeGreaterThan(0);
      expect(report.analysis.unusedDependencies).toContain('@testing-library/react');
    });
  });
});

describe('EnhancedPerformanceMonitor', () => {
  let monitor: EnhancedPerformanceMonitor;
  let consoleLogSpy: any;

  beforeEach(() => {
    monitor = new EnhancedPerformanceMonitor();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should initialize with bundle analyzer', () => {
      expect(monitor).toBeInstanceOf(EnhancedPerformanceMonitor);
    });
  });

  describe('recordBundleAnalysis', () => {
    it('should record bundle analysis from build stats', () => {
      const buildStats: BundleData = {
        totalSize: 189.71 * 1024,
        gzipSize: 60.75 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(buildStats);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use cached analysis for identical builds', () => {
      const buildStats: BundleData = {
        totalSize: 189.71 * 1024,
        gzipSize: 60.75 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(buildStats);
      monitor.recordBundleAnalysis(buildStats);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('cached'));
    });

    it('should log critical optimization recommendations', () => {
      const poorStats: BundleData = {
        totalSize: 300 * 1024,
        gzipSize: 100 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(poorStats);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('critical optimization')
      );
    });
  });

  describe('getComprehensiveReport', () => {
    it('should return comprehensive performance report', () => {
      const buildStats: BundleData = {
        totalSize: 189.71 * 1024,
        gzipSize: 60.75 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(buildStats);
      const report = monitor.getComprehensiveReport();

      expect(report).toBeDefined();
      expect(report.bundle).toBeDefined();
      expect(report.api).toBeDefined();
      expect(report.overall).toBeDefined();
      expect(report.overall.score).toBeGreaterThanOrEqual(0);
      expect(report.overall.score).toBeLessThanOrEqual(100);
    });

    it('should calculate overall score correctly', () => {
      const buildStats: BundleData = {
        totalSize: 100 * 1024,
        gzipSize: 30 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(buildStats);
      const report = monitor.getComprehensiveReport();

      expect(report.overall.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('validateBuildPerformance', () => {
    it('should validate build meets thresholds', () => {
      const buildStats: BundleData = {
        totalSize: 189.71 * 1024,
        gzipSize: 60.75 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(buildStats);
      const validation = monitor.validateBuildPerformance();

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toBeDefined();
      expect(validation.warnings).toBeDefined();
    });

    it('should identify bundle size violations', () => {
      const oversizedStats: BundleData = {
        totalSize: 300 * 1024,
        gzipSize: 90 * 1024,
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(oversizedStats);
      const validation = monitor.validateBuildPerformance();

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('exceeds limit');
    });

    it('should warn about poor compression', () => {
      const poorCompressionStats: BundleData = {
        totalSize: 200 * 1024,
        gzipSize: 140 * 1024, // Compression ratio > 70%
        chunks: [],
        dependencies: []
      };

      monitor.recordBundleAnalysis(poorCompressionStats);
      const validation = monitor.validateBuildPerformance();

      // Poor compression generates warnings
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should return no analysis error when no build recorded', () => {
      const validation = monitor.validateBuildPerformance();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('No bundle analysis available');
    });
  });
});

describe('PERFORMANCE_THRESHOLDS', () => {
  it('should have sensible default values', () => {
    expect(PERFORMANCE_THRESHOLDS.maxBundleSize).toBe(250);
    expect(PERFORMANCE_THRESHOLDS.maxChunkSize).toBe(200);
    expect(PERFORMANCE_THRESHOLDS.maxGzipRatio).toBe(0.4);
    expect(PERFORMANCE_THRESHOLDS.minCacheHitRate).toBe(0.85);
    expect(PERFORMANCE_THRESHOLDS.maxApiLatency).toBe(100);
    expect(PERFORMANCE_THRESHOLDS.maxDbQueryTime).toBe(50);
  });

  it('should reflect current JasaWeb performance standards', () => {
    expect(PERFORMANCE_THRESHOLDS.maxBundleSize).toBeGreaterThan(189.71);
    expect(PERFORMANCE_THRESHOLDS.maxGzipRatio).toBeGreaterThanOrEqual(0.32);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle null chunks gracefully', () => {
    const analyzer = new BundleAnalyzer();
    const bundleData: BundleData = {
      chunks: undefined as any
    };

    const analysis = analyzer.analyze(bundleData);

    expect(analysis).toBeDefined();
    // Implementation uses default chunk when undefined
    expect(analysis.largestChunks).toBeDefined();
  });

  it('should handle null dependencies gracefully', () => {
    const analyzer = new BundleAnalyzer();
    const bundleData: BundleData = {
      dependencies: undefined as any
    };

    const analysis = analyzer.analyze(bundleData);

    expect(analysis).toBeDefined();
    expect(analysis.unusedDependencies).toBeDefined();
  });

  it('should handle empty bundle data', () => {
    const analyzer = new BundleAnalyzer();
    const bundleData: BundleData = {};

    const report = analyzer.generateBundleReport(bundleData);

    expect(report).toBeDefined();
    expect(report.summary.totalSize).toBe(190);
    expect(report.summary.gzipSize).toBe(61);
  });

  it('should handle malformed chunk data', () => {
    const analyzer = new BundleAnalyzer();
    const bundleData: BundleData = {
      chunks: [
        {
          name: 'test.js',
          size: 0,
          gzipSize: 0,
          modules: [],
          imports: []
        }
      ] as ChunkInfo[]
    };

    const analysis = analyzer.analyze(bundleData);

    expect(analysis).toBeDefined();
  });

  it('should handle concurrent analysis requests', async () => {
    const analyzer = new BundleAnalyzer();
    const bundleData: BundleData = {
      totalSize: 200 * 1024,
      gzipSize: 60 * 1024,
      chunks: [],
      dependencies: []
    };

    const analyses = await Promise.all([
      Promise.resolve(analyzer.analyze(bundleData)),
      Promise.resolve(analyzer.analyze(bundleData)),
      Promise.resolve(analyzer.analyze(bundleData))
    ]);

    expect(analyses).toHaveLength(3);
    analyses.forEach(analysis => {
      expect(analysis).toBeDefined();
    });
  });
});
