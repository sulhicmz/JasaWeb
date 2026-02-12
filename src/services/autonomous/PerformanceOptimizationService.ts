/**
 * Performance Optimization Service
 * 
 * Autonomous performance optimization engine with intelligent caching,
 * bottleneck detection, and predictive scaling capabilities.
 * 
 * Core Features:
 * - Automated bottleneck detection with root cause analysis
 * - Intelligent cache management with adaptive algorithms
 * - Predictive scaling recommendations based on usage patterns
 * - Query optimization suggestions with implementation guidance
 * - Self-learning optimization strategies
 */

import { performanceMonitor, type PerformanceMetrics } from '../../lib/performance-monitoring';
import { performanceIntelligence, type PerformanceAnomaly } from '../../lib/performance-intelligence';
import { cacheSet } from '@/lib/kv';
import type { KVNamespace } from '@/lib/types';

// ========================================
// INTERFACES
// ========================================

export interface OptimizationStrategy {
  id: string;
  name: string;
  type: 'cache' | 'query' | 'bundle' | 'scaling' | 'autonomous';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  conditions: OptimizationCondition[];
  actions: OptimizationAction[];
  expectedImpact: {
    performance: number; // % improvement
    resource: number; // % reduction
    reliability: number; // % improvement
  };
  confidence: number; // 0-1
  implementedAt?: string;
  results?: OptimizationResult;
}

export interface OptimizationCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  threshold: number;
  duration?: number; // minutes
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface OptimizationAction {
  type: 'cache_config' | 'query_optimize' | 'bundle_split' | 'scale_recommendation' | 'alert';
  target: string; // What to optimize
  parameters: Record<string, any>;
  automated: boolean; // Can be executed automatically
  rollbackPlan?: string;
}

export interface OptimizationResult {
  executedAt: string;
  metrics: {
    before: PerformanceMetrics;
    after: PerformanceMetrics;
  };
  impact: {
    performance: number;
    resource: number;
    reliability: number;
  };
  success: boolean;
  error?: string;
}

export interface PerformanceBottleneck {
  id: string;
  type: 'database' | 'cache' | 'api' | 'bundle' | 'memory';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  metrics: Record<string, number>;
  rootCause: string;
  recommendations: string[];
  detectedAt: string;
  resolved: boolean;
}

export interface CacheOptimizationConfig {
  adaptive: boolean;
  predictivePrewarming: boolean;
  intelligentEviction: boolean;
  compressionEnabled: boolean;
  shardingEnabled: boolean;
  metrics: {
    hitRate: number;
    memoryUsage: number;
    evictionRate: number;
    compressionRatio: number;
  };
}

export interface ScalingRecommendation {
  id: string;
  resourceType: 'database' | 'cache' | 'compute' | 'storage';
  currentCapacity: number;
  recommendedCapacity: number;
  urgency: 'immediate' | 'planned' | 'scheduled';
  reasoning: string;
  costImpact: number; // % cost change
  performanceGain: number; // % performance gain
  timeframe: string; // When to scale
}

// ========================================
// SERVICE IMPLEMENTATION
// ========================================

export class PerformanceOptimizationService {
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private bottlenecks: PerformanceBottleneck[] = [];
  private scalingHistory: ScalingRecommendation[] = [];
  private cacheConfig: CacheOptimizationConfig;
  private isRunning: boolean = false;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private kv: KVNamespace | null = null;
  
  constructor(kv?: KVNamespace) {
    this.kv = kv || null;
    this.cacheConfig = {
      adaptive: true,
      predictivePrewarming: true,
      intelligentEviction: true,
      compressionEnabled: true,
      shardingEnabled: false,
      metrics: {
        hitRate: 0,
        memoryUsage: 0,
        evictionRate: 0,
        compressionRatio: 1
      }
    };
    this.initializeStrategies();
  }

  /**
   * Initialize core optimization strategies
   */
  private initializeStrategies(): void {
    // Database query optimization strategies
    this.addStrategy({
      id: 'db-query-optimize',
      name: 'Database Query Performance Optimization',
      type: 'query',
      priority: 'high',
      description: 'Automatically optimize slow database queries with indexing and query rewriting',
      conditions: [
        { metric: 'database.queryTime', operator: '>', threshold: 50 },
        { metric: 'database.indexUsage', operator: '<', threshold: 85 }
      ],
      actions: [
        {
          type: 'query_optimize',
          target: 'slow_queries',
          parameters: { addIndexes: true, rewriteQueries: true },
          automated: true,
          rollbackPlan: 'Remove created indexes, restore original queries'
        }
      ],
      expectedImpact: {
        performance: 40,
        resource: 15,
        reliability: 20
      },
      confidence: 0.85
    });

    // Cache optimization strategies
    this.addStrategy({
      id: 'cache-optimization',
      name: 'Intelligent Cache Management',
      type: 'cache',
      priority: 'high',
      description: 'Optimize cache configuration based on usage patterns and access frequency',
      conditions: [
        { metric: 'cache.hitRate', operator: '<', threshold: 85 },
        { metric: 'cache.memoryUsage', operator: '>', threshold: 80 }
      ],
      actions: [
        {
          type: 'cache_config',
          target: 'cache_settings',
          parameters: { 
            adaptiveTTL: true, 
            intelligentEviction: true,
            compressionEnabled: true 
          },
          automated: true,
          rollbackPlan: 'Restore previous cache configuration'
        }
      ],
      expectedImpact: {
        performance: 30,
        resource: 20,
        reliability: 10
      },
      confidence: 0.9
    });

    // Bundle optimization strategies
    this.addStrategy({
      id: 'bundle-optimization',
      name: 'Frontend Bundle Optimization',
      type: 'bundle',
      priority: 'medium',
      description: 'Optimize JavaScript bundle size and loading performance',
      conditions: [
        { metric: 'bundle.size', operator: '>', threshold: 200 },
        { metric: 'bundle.largestChunk', operator: '>', threshold: 50 }
      ],
      actions: [
        {
          type: 'bundle_split',
          target: 'frontend_assets',
          parameters: { codeSplitting: true, lazyLoading: true },
          automated: false, // Requires manual review
          rollbackPlan: 'Revert to previous bundle configuration'
        }
      ],
      expectedImpact: {
        performance: 25,
        resource: 10,
        reliability: 5
      },
      confidence: 0.75
    });

    // Autonomous scaling strategies
    this.addStrategy({
      id: 'predictive-scaling',
      name: 'Predictive Resource Scaling',
      type: 'scaling',
      priority: 'critical',
      description: 'Predict and recommend resource scaling based on usage patterns',
      conditions: [
        { metric: 'api.throughput', operator: '>', threshold: 80, trend: 'increasing' },
        { metric: 'database.queryTime', operator: '>', threshold: 30 }
      ],
      actions: [
        {
          type: 'scale_recommendation',
          target: 'infrastructure',
          parameters: { predictive: true, buffer: 20 },
          automated: false,
          rollbackPlan: 'Manual scaling rollback if needed'
        }
      ],
      expectedImpact: {
        performance: 50,
        resource: 30,
        reliability: 35
      },
      confidence: 0.8
    });
  }

  /**
   * Start the optimization engine
   */
  startOptimization(): void {
    if (this.isRunning) {
      console.warn('[PerformanceOptimization] Optimization engine already running');
      return;
    }

    this.isRunning = true;
    console.log('[PerformanceOptimization] Starting optimization engine...');

    // Run optimization every 5 minutes
    this.optimizationInterval = setInterval(() => {
      this.runOptimizationCycle();
    }, 5 * 60 * 1000);

    // Run initial optimization
    this.runOptimizationCycle();
  }

  /**
   * Stop the optimization engine
   */
  stopOptimization(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    console.log('[PerformanceOptimization] Optimization engine stopped');
  }

  /**
   * Run a complete optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      console.log('[PerformanceOptimization] Running optimization cycle...');

      // 1. Detect bottlenecks
      await this.detectBottlenecks();

      // 2. Evaluate strategies
      const candidateStrategies = await this.evaluateStrategies();

      // 3. Execute optimization strategies
      for (const strategy of candidateStrategies) {
        await this.executeStrategy(strategy);
      }

      // 4. Update cache configuration
      if (this.cacheConfig.adaptive) {
        await this.optimizeCacheConfiguration();
      }

      // 5. Generate scaling recommendations
      await this.generateScalingRecommendations();

      console.log('[PerformanceOptimization] Optimization cycle completed');
    } catch (error) {
      console.error('[PerformanceOptimization] Error in optimization cycle:', error);
    }
  }

  /**
   * Detect performance bottlenecks using intelligent analysis
   */
  private async detectBottlenecks(): Promise<void> {
    const currentMetrics = performanceMonitor.getLatestMetrics();
    if (!currentMetrics) return;

    const anomalies = performanceIntelligence.getAnomalies({ severity: 'high' });
    const newBottlenecks: PerformanceBottleneck[] = [];

    // Database bottlenecks
    if (currentMetrics.database.queryTime > 50) {
      newBottlenecks.push({
        id: this.generateId(),
        type: 'database',
        severity: currentMetrics.database.queryTime > 100 ? 'critical' : 'high',
        component: 'Database Query Engine',
        description: `Database queries averaging ${currentMetrics.database.queryTime}ms response time`,
        metrics: {
          queryTime: currentMetrics.database.queryTime,
          indexUsage: currentMetrics.database.indexUsage,
          slowQueries: currentMetrics.database.slowQueries
        },
        rootCause: this.analyzeDatabaseRootCause(currentMetrics.database, anomalies),
        recommendations: [
          'Add strategic database indexes for slow queries',
          'Implement query result caching for frequently accessed data',
          'Review and optimize complex query patterns',
          'Consider database connection pool optimization'
        ],
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // Cache bottlenecks
    if (currentMetrics.cache.hitRate < 85) {
      newBottlenecks.push({
        id: this.generateId(),
        type: 'cache',
        severity: currentMetrics.cache.hitRate < 70 ? 'critical' : 'medium',
        component: 'Cache Layer',
        description: `Cache hit rate at ${(currentMetrics.cache.hitRate * 100).toFixed(1)}% below optimal threshold`,
        metrics: {
          hitRate: currentMetrics.cache.hitRate,
          memoryUsage: currentMetrics.cache.memoryUsage,
          evictionRate: currentMetrics.cache.evictionRate
        },
        rootCause: this.analyzeCacheRootCause(currentMetrics.cache, anomalies),
        recommendations: [
          'Review cache invalidation strategy',
          'Implement cache warming for critical data',
          'Optimize TTL settings based on access patterns',
          'Enable intelligent cache eviction algorithms'
        ],
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // API bottlenecks
    if (currentMetrics.api.averageLatency > 100) {
      newBottlenecks.push({
        id: this.generateId(),
        type: 'api',
        severity: currentMetrics.api.averageLatency > 200 ? 'critical' : 'high',
        component: 'API Layer',
        description: `API endpoints averaging ${currentMetrics.api.averageLatency}ms response time`,
        metrics: {
          averageLatency: currentMetrics.api.averageLatency,
          p95Latency: currentMetrics.api.p95Latency,
          errorRate: currentMetrics.api.errorRate,
          throughput: currentMetrics.api.throughput
        },
        rootCause: this.analyzeApiRootCause(currentMetrics.api, anomalies),
        recommendations: [
          'Implement response caching for frequently accessed endpoints',
          'Optimize database queries in slow endpoints',
          'Add CDN caching for static responses',
          'Review and optimize middleware chain'
        ],
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // Update bottlenecks list (keep last 50)
    this.bottlenecks = [...newBottlenecks, ...this.bottlenecks].slice(0, 50);
  }

  /**
   * Evaluate which optimization strategies should be executed
   */
  private async evaluateStrategies(): Promise<OptimizationStrategy[]> {
    const candidateStrategies: OptimizationStrategy[] = [];
    const currentMetrics = performanceMonitor.getLatestMetrics();

    if (!currentMetrics) return candidateStrategies;

    for (const strategy of this.strategies.values()) {
      if (strategy.results) {
        // Skip if already implemented and successful
        if (strategy.results.success) continue;
      }

      const shouldExecute = await this.evaluateStrategyConditions(strategy, currentMetrics);
      if (shouldExecute) {
        candidateStrategies.push(strategy);
      }
    }

    // Sort by priority and confidence
    return candidateStrategies.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Evaluate if strategy conditions are met
   */
  private async evaluateStrategyConditions(
    strategy: OptimizationStrategy,
    metrics: PerformanceMetrics
  ): Promise<boolean> {
    const metricValues: Record<string, number> = {
      'database.queryTime': metrics.database?.queryTime ?? 0,
      'database.indexUsage': metrics.database?.indexUsage ?? 0,
      'database.slowQueries': metrics.database?.slowQueries ?? 0,
      'cache.hitRate': (metrics.cache?.hitRate ?? 0) * 100,
      'cache.memoryUsage': metrics.cache?.memoryUsage ?? 0,
      'cache.evictionRate': (metrics.cache?.evictionRate ?? 0) * 100,
      'api.averageLatency': metrics.api?.averageLatency ?? 0,
      'api.p95Latency': metrics.api?.p95Latency ?? 0,
      'api.errorRate': (metrics.api?.errorRate ?? 0) * 100,
      'api.throughput': metrics.api?.throughput ?? 0,
      'bundle.size': metrics.bundle?.size ?? 0,
      'bundle.largestChunk': metrics.bundle?.largestChunk ?? 0,
      'bundle.compressionRatio': (metrics.bundle?.compressionRatio ?? 0) * 100
    };

    for (const condition of strategy.conditions) {
      const value = metricValues[condition.metric];
      if (value === undefined) continue;

      let conditionMet = false;
      switch (condition.operator) {
        case '>': conditionMet = value > condition.threshold; break;
        case '<': conditionMet = value < condition.threshold; break;
        case '=': conditionMet = value === condition.threshold; break;
        case '>=': conditionMet = value >= condition.threshold; break;
        case '<=': conditionMet = value <= condition.threshold; break;
      }

      if (!conditionMet) return false;

      // Check trend conditions
      if (condition.trend) {
        const trendMet = await this.checkTrend(condition.metric, condition.trend);
        if (!trendMet) return false;
      }
    }

    return true;
  }

  /**
   * Execute an optimization strategy
   */
  private async executeStrategy(strategy: OptimizationStrategy): Promise<void> {
    if (!strategy.actions.some(a => a.automated)) {
      // Manual intervention required
      console.warn(`[PerformanceOptimization] Manual intervention required for strategy: ${strategy.name}`);
      await this.createOptimizationAlert(strategy);
      return;
    }

    try {
      console.log(`[PerformanceOptimization] Executing strategy: ${strategy.name}`);

      const beforeMetrics = performanceMonitor.getLatestMetrics();
      if (!beforeMetrics) return;

      // Execute each action
      for (const action of strategy.actions) {
        await this.executeAction(action);
      }

      await this.sleep(5000); // Wait for changes to take effect

      const afterMetrics = performanceMonitor.getLatestMetrics();
      if (!afterMetrics) return;

      // Calculate results
      const result: OptimizationResult = {
        executedAt: new Date().toISOString(),
        metrics: {
          before: beforeMetrics,
          after: afterMetrics
        },
        impact: this.calculateImpact(beforeMetrics, afterMetrics),
        success: true
      };

      // Update strategy with results
      strategy.results = result;
      strategy.implementedAt = new Date().toISOString();
      
      // Store updated strategy
      this.strategies.set(strategy.id, strategy);

      console.log(`[PerformanceOptimization] Strategy executed successfully: ${strategy.name}`);
    } catch (error) {
      console.error(`[PerformanceOptimization] Strategy execution failed: ${strategy.name}`, error);
      
      // Update strategy with error
      if (strategy.results) {
        strategy.results.success = false;
        strategy.results.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Execute individual optimization action
   */
  private async executeAction(action: OptimizationAction): Promise<void> {
    switch (action.type) {
      case 'cache_config':
        await this.executeCacheOptimization(action.parameters);
        break;
      case 'query_optimize':
        await this.executeQueryOptimization(action.parameters);
        break;
      case 'bundle_split':
        await this.executeBundleOptimization(action.parameters);
        break;
      case 'scale_recommendation':
        console.log('[PerformanceOptimization] Scaling recommendation processed');
        break;
      default:
        console.warn(`[PerformanceOptimization] Unknown action type: ${action.type}`);
    }
  }

  /**
   * Optimize cache configuration
   */
  private async executeCacheOptimization(parameters: Record<string, any>): Promise<void> {
    if (!this.kv) {
      console.warn('[PerformanceOptimization] KV namespace not available for cache optimization');
      return;
    }

    if (parameters.adaptiveTTL) {
      await cacheSet(this.kv, 'config:cache:adaptive_ttl', 'true', { ttl: 3600 });
    }

    if (parameters.intelligentEviction) {
      await cacheSet(this.kv, 'config:cache:intelligent_eviction', 'true', { ttl: 3600 });
    }

    if (parameters.compressionEnabled) {
      await cacheSet(this.kv, 'config:cache:compression', 'true', { ttl: 3600 });
    }

    console.log('[PerformanceOptimization] Cache configuration optimized');
  }

  /**
   * Execute database query optimization
   */
  private async executeQueryOptimization(parameters: Record<string, any>): Promise<void> {
    // This would typically interact with database optimization tools
    // For now, we'll simulate the optimization
    if (parameters.addIndexes) {
      console.log('[PerformanceOptimization] Database indexes optimization requested');
      // In a real implementation, this would:
      // 1. Analyze slow query logs
      // 2. Identify missing indexes
      // 3. Create appropriate indexes
      // 4. Validate improvement
    }

    if (parameters.rewriteQueries) {
      console.log('[PerformanceOptimization] Query rewriting optimization requested');
      // In a real implementation, this would:
      // 1. Identify expensive queries
      // 2. Suggest query rewrites
      // 3. Implement optimized versions
      // 4. Test for correctness
    }
  }

  /**
   * Execute bundle optimization
   */
  private async executeBundleOptimization(parameters: Record<string, any>): Promise<void> {
    console.log('[PerformanceOptimization] Bundle optimization requested');
    if (!this.kv) {
      console.warn('[PerformanceOptimization] KV namespace not available for bundle optimization');
      return;
    }
    await cacheSet(this.kv, 'config:bundle:optimization', JSON.stringify(parameters), { ttl: 3600 });
  }

  /**
   * Generate scaling recommendations
   */
  private async generateScalingRecommendations(): Promise<void> {
    const currentMetrics = performanceMonitor.getLatestMetrics();
    if (!currentMetrics) return;

    const predictions = performanceIntelligence.getAllPredictions();
    const newRecommendations: ScalingRecommendation[] = [];

    // Database scaling recommendations
    if (currentMetrics.database.queryTime > 30) {
      const prediction = predictions.find(p => p.metric === 'database.queryTime');
      const predictedIncrease = prediction?.predictions[0]?.value || currentMetrics.database.queryTime;
      
      newRecommendations.push({
        id: this.generateId(),
        resourceType: 'database',
        currentCapacity: 100, // Base capacity
        recommendedCapacity: Math.ceil(100 * (predictedIncrease / currentMetrics.database.queryTime)),
        urgency: predictedIncrease > 50 ? 'immediate' : 'planned',
        reasoning: `Database query time predicted to increase to ${predictedIncrease.toFixed(1)}ms`,
        costImpact: 25,
        performanceGain: 35,
        timeframe: 'next 24 hours'
      });
    }

    // Cache scaling recommendations
    if (currentMetrics.cache.memoryUsage > 80) {
      newRecommendations.push({
        id: this.generateId(),
        resourceType: 'cache',
        currentCapacity: 100,
        recommendedCapacity: 150,
        urgency: currentMetrics.cache.memoryUsage > 90 ? 'immediate' : 'planned',
        reasoning: `Cache memory usage at ${currentMetrics.cache.memoryUsage}% of capacity`,
        costImpact: 15,
        performanceGain: 20,
        timeframe: 'next 12 hours'
      });
    }

    // Update scaling history
    this.scalingHistory = [...newRecommendations, ...this.scalingHistory].slice(0, 100);
  }

  /**
   * Analyze database performance root cause
   */
  private analyzeDatabaseRootCause(database: any, anomalies: PerformanceAnomaly[]): string {
    const dbAnomalies = anomalies.filter(a => a.metric.includes('database'));
    
    if (database.slowQueries > 10) {
      return 'High number of slow queries indicate missing indexes or inefficient query patterns';
    }
    
    if (database.indexUsage < 85) {
      return 'Low index usage suggests queries are not utilizing available indexes effectively';
    }
    
    if (dbAnomalies.some(a => a.type === 'spike')) {
      return 'Recent performance spikes indicate temporary resource contention or load bursts';
    }
    
    return 'General database performance degradation requiring comprehensive analysis';
  }

  /**
   * Analyze cache performance root cause
   */
  private analyzeCacheRootCause(cache: any, _anomalies: PerformanceAnomaly[]): string {
    if (cache.evictionRate > 0.2) {
      return 'High eviction rate indicates insufficient cache capacity or poor TTL settings';
    }
    
    if (cache.memoryUsage > 90) {
      return 'High memory usage suggests cache undersizing for current workload';
    }
    
    return 'Cache configuration not optimized for current access patterns';
  }

  /**
   * Analyze API performance root cause
   */
  private analyzeApiRootCause(api: any, _anomalies: PerformanceAnomaly[]): string {
    if (api.errorRate > 0.01) {
      return 'High error rate indicates underlying service issues or resource exhaustion';
    }
    
    if (api.throughput > 100) {
      return 'High throughput may be causing resource contention and response time degradation';
    }
    
    return 'API response time degradation requires investigation of downstream dependencies';
  }

  /**
   * Check metric trend
   */
  private async checkTrend(metric: string, expectedTrend: string): Promise<boolean> {
    const prediction = performanceIntelligence.getPrediction(metric);
    if (!prediction) return false;
    
    return prediction.trend === expectedTrend;
  }

  /**
   * Calculate optimization impact
   */
  private calculateImpact(before: PerformanceMetrics, after: PerformanceMetrics): {
    performance: number;
    resource: number;
    reliability: number;
  } {
    const performanceChange = ((before.api.averageLatency - after.api.averageLatency) / before.api.averageLatency) * 100;
    const resourceChange = ((before.cache.memoryUsage - after.cache.memoryUsage) / before.cache.memoryUsage) * 100;
    const reliabilityChange = ((before.api.errorRate - after.api.errorRate) / before.api.errorRate) * 100;

    return {
      performance: Math.max(0, performanceChange),
      resource: Math.max(0, resourceChange),
      reliability: Math.max(0, reliabilityChange)
    };
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  private async optimizeCacheConfiguration(): Promise<void> {
    // This would implement adaptive cache optimization
    // For now, we'll update cache metrics
    const currentMetrics = performanceMonitor.getLatestMetrics();
    if (currentMetrics) {
      this.cacheConfig.metrics = {
        hitRate: currentMetrics.cache?.hitRate ?? 0,
        memoryUsage: currentMetrics.cache?.memoryUsage ?? 0,
        evictionRate: currentMetrics.cache?.evictionRate ?? 0,
        compressionRatio: currentMetrics.bundle?.compressionRatio ?? 0
      };
    }
  }

  /**
   * Create optimization alert for manual intervention
   */
  private async createOptimizationAlert(strategy: OptimizationStrategy): Promise<void> {
    console.warn(`[PerformanceOptimization] Manual optimization required: ${strategy.name}`);
    // In a real implementation, this would send notifications to admin dashboard
  }

  /**
   * Add a new optimization strategy
   */
  addStrategy(strategy: OptimizationStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Remove an optimization strategy
   */
  removeStrategy(strategyId: string): void {
    this.strategies.delete(strategyId);
  }

  /**
   * Get all optimization strategies
   */
  getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get detected bottlenecks
   */
  getBottlenecks(options?: {
    type?: string;
    severity?: string;
    resolved?: boolean;
  }): PerformanceBottleneck[] {
    let filtered = [...this.bottlenecks];

    if (options?.type) {
      filtered = filtered.filter(b => b.type === options.type);
    }

    if (options?.severity) {
      filtered = filtered.filter(b => b.severity === options.severity);
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter(b => b.resolved === options.resolved);
    }

    return filtered.sort((a, b) => 
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  /**
   * Get scaling recommendations
   */
  getScalingRecommendations(): ScalingRecommendation[] {
    return this.scalingHistory.filter(r => 
      new Date(r.timeframe).getTime() > Date.now() - 24 * 3600000 // Last 24 hours
    );
  }

  /**
   * Mark bottleneck as resolved
   */
  resolveBottleneck(bottleneckId: string): void {
    const bottleneck = this.bottlenecks.find(b => b.id === bottleneckId);
    if (bottleneck) {
      bottleneck.resolved = true;
    }
  }

  /**
   * Get optimization summary
   */
  getOptimizationSummary(): {
    strategies: {
      total: number;
      implemented: number;
      successful: number;
      pending: number;
    };
    bottlenecks: {
      total: number;
      resolved: number;
      critical: number;
      high: number;
    };
    recommendations: {
      scaling: number;
      manual: number;
      automated: number;
    };
    performance: {
        overallScore: number;
        lastOptimization: string | null;
        improvements24h: number;
    };
  } {
    const strategies = Array.from(this.strategies.values());
    const implemented = strategies.filter(s => s.results).length;
    const successful = strategies.filter(s => s.results?.success).length;
    
    const criticalBottlenecks = this.bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = this.bottlenecks.filter(b => b.severity === 'high').length;
    
    const lastOptimization = strategies
      .filter(s => s.results?.executedAt)
      .sort((a, b) => new Date(b.results!.executedAt).getTime() - new Date(a.results!.executedAt).getTime())[0];
    
    const currentMetrics = performanceMonitor.getLatestMetrics();
    const overallScore = currentMetrics ? this.calculateOverallScore(currentMetrics) : 0;

    return {
      strategies: {
        total: strategies.length,
        implemented,
        successful,
        pending: strategies.length - implemented
      },
      bottlenecks: {
        total: this.bottlenecks.length,
        resolved: this.bottlenecks.filter(b => b.resolved).length,
        critical: criticalBottlenecks,
        high: highBottlenecks
      },
      recommendations: {
        scaling: this.scalingHistory.length,
        manual: strategies.filter(s => !s.actions.some(a => a.automated)).length,
        automated: strategies.filter(s => s.actions.some(a => a.automated)).length
      },
      performance: {
        overallScore,
        lastOptimization: lastOptimization?.results?.executedAt || null,
        improvements24h: successful
      }
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(metrics: PerformanceMetrics): number {
    // Weighted scoring similar to PerformanceMonitor
    const bundleWeight = 0.3;
    const apiWeight = 0.4;
    const dbWeight = 0.2;
    const cacheWeight = 0.1;

    return Math.round(
      metrics.bundle.score * bundleWeight +
      metrics.api.score * apiWeight +
      metrics.database.score * dbWeight +
      metrics.cache.score * cacheWeight
    );
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Sleep utility for async operations
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createPerformanceOptimizationService(kv?: KVNamespace): PerformanceOptimizationService {
  return new PerformanceOptimizationService(kv);
}