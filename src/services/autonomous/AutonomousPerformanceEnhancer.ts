/**
 * Autonomous Agent Performance Enhancement
 * 
 * Integrates the Performance Optimization Service with the autonomous agent
 * system to enable self-healing and self-optimization capabilities.
 */

import { createPerformanceOptimizationService } from './PerformanceOptimizationService';
import type { PerformanceRecommendation } from '../../lib/performance-monitoring';
import type { PerformanceAnomaly } from '../../lib/performance-intelligence';
import { JasaWebTempMemory } from './JasaWebMemoryService';

export interface AutonomousPerformanceConfig {
  enableSelfHealing: boolean;
  enableSelfOptimization: boolean;
  enableLearning: boolean;
  decisionThreshold: number; // Confidence threshold for autonomous actions
  rollbackEnabled: boolean;
  maxConcurrentOptimizations: number;
}

const DEFAULT_AUTONOMOUS_CONFIG: AutonomousPerformanceConfig = {
  enableSelfHealing: true,
  enableSelfOptimization: true,
  enableLearning: true,
  decisionThreshold: 0.8,
  rollbackEnabled: true,
  maxConcurrentOptimizations: 3
};

export class AutonomousPerformanceEnhancer {
  private optimizationService: ReturnType<typeof createPerformanceOptimizationService>;
  private memoryService: JasaWebTempMemory;
  private config: AutonomousPerformanceConfig;
  private activeOptimizations: Set<string> = new Set();
  private learningHistory: Map<string, any[]> = new Map();

  constructor(
    kv: any,
    memoryService: JasaWebTempMemory,
    config?: Partial<AutonomousPerformanceConfig>
  ) {
    this.optimizationService = createPerformanceOptimizationService(kv);
    this.memoryService = memoryService;
    this.config = { ...DEFAULT_AUTONOMOUS_CONFIG, ...config };
  }

  /**
   * Process performance anomalies and trigger autonomous responses
   */
  async handlePerformanceAnomalies(anomalies: PerformanceAnomaly[]): Promise<void> {
    if (!this.config.enableSelfHealing) return;

    for (const anomaly of anomalies) {
      await this.processAnomaly(anomaly);
    }
  }

  /**
   * Process individual performance anomaly
   */
  private async processAnomaly(anomaly: PerformanceAnomaly): Promise<void> {
    // Check if we already have an active optimization for this
    const optimizationKey = `${anomaly.metric}-${anomaly.type}`;
    if (this.activeOptimizations.has(optimizationKey)) {
      return;
    }

    // Check confidence threshold
    if (anomaly.confidence < this.config.decisionThreshold) {
      await this.recordLearningEvent('anomaly_skipped', {
        reason: 'low_confidence',
        anomaly: anomaly.id,
        confidence: anomaly.confidence
      });
      return;
    }

    // Store in memory for learning
    await this.memoryService.storeFact(
      anomaly.metric,
      'has_anomaly',
      anomaly.id,
      {
        severity: anomaly.severity,
        type: anomaly.type,
        value: anomaly.value,
        expectedValue: anomaly.expectedValue,
        deviation: anomaly.deviation,
        timestamp: anomaly.timestamp
      },
      new Date()
    );

    // Trigger autonomous healing
    await this.triggerAutonomousHealing(anomaly, optimizationKey);
  }

  /**
   * Trigger autonomous healing based on anomaly
   */
  private async triggerAutonomousHealing(
    anomaly: PerformanceAnomaly,
    optimizationKey: string
  ): Promise<void> {
    this.activeOptimizations.add(optimizationKey);

    try {
      const healingActions = await this.determineHealingActions(anomaly);
      
      for (const action of healingActions) {
        await this.executeHealingAction(anomaly, action);
      }

      await this.recordLearningEvent('healing_successful', {
        anomalyId: anomaly.id,
        actions: healingActions.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await this.recordLearningEvent('healing_failed', {
        anomalyId: anomaly.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.activeOptimizations.delete(optimizationKey);
    }
  }

  /**
   * Determine appropriate healing actions for anomaly
   */
  private async determineHealingActions(
    anomaly: PerformanceAnomaly
  ): Promise<string[]> {
    const actions: string[] = [];

    // Based on metric type and anomaly characteristics
    if (anomaly.metric.includes('database') || anomaly.metric.includes('query')) {
      actions.push('database_optimization');
      if (anomaly.severity === 'critical') {
        actions.push('cache_warming');
      }
    }

    if (anomaly.metric.includes('cache')) {
      actions.push('cache_optimization');
      if (anomaly.type === 'drop') {
        actions.push('cache_prewarming');
      }
    }

    if (anomaly.metric.includes('api') || anomaly.metric.includes('latency')) {
      actions.push('api_optimization');
      if (anomaly.severity === 'critical') {
        actions.push('scaling_recommendation');
      }
    }

    if (anomaly.metric.includes('memory') || anomaly.metric.includes('bundle')) {
      actions.push('bundle_optimization');
    }

    return actions;
  }

  /**
   * Execute healing action
   */
  private async executeHealingAction(
    anomaly: PerformanceAnomaly,
    action: string
  ): Promise<void> {
    switch (action) {
      case 'database_optimization':
        await this.executeDatabaseOptimization(anomaly);
        break;
      case 'cache_optimization':
        await (this.optimizationService as any).executeCacheOptimization({
          adaptiveTTL: true,
          intelligentEviction: true,
          compressionEnabled: true
        });
        break;
      case 'cache_prewarming':
        await this.executeCachePrewarming(anomaly);
        break;
      case 'api_optimization':
        await this.executeApiOptimization(anomaly);
        break;
      case 'scaling_recommendation':
        await this.generateUrgentScalingRecommendation(anomaly);
        break;
      case 'bundle_optimization':
        await (this.optimizationService as any).executeBundleOptimization({
          codeSplitting: true,
          lazyLoading: true
        });
        break;
    }
  }

  /**
   * Execute database optimization
   */
  private async executeDatabaseOptimization(anomaly: PerformanceAnomaly): Promise<void> {
    this.optimizationService.addStrategy({
      id: `autonomous-db-${anomaly.id}`,
      name: `Autonomous Database Optimization for ${anomaly.metric}`,
      type: 'query',
      priority: anomaly.severity === 'critical' ? 'critical' : 'high',
      description: `Automatically triggered optimization for ${anomaly.metric}`,
      conditions: [
        {
          metric: anomaly.metric,
          operator: '>',
          threshold: anomaly.expectedValue
        }
      ],
      actions: [
        {
          type: 'query_optimize',
          target: anomaly.metric,
          parameters: {
            addIndexes: true,
            rewriteQueries: true,
            urgency: anomaly.severity
          },
          automated: true,
          rollbackPlan: 'Remove created indexes, restore queries'
        }
      ],
      expectedImpact: {
        performance: 35,
        resource: 20,
        reliability: 25
      },
      confidence: anomaly.confidence
    });
  }

  /**
   * Execute cache prewarming
   */
  private async executeCachePrewarming(anomaly: PerformanceAnomaly): Promise<void> {
    await this.recordLearningEvent('cache_prewarming', {
      trigger: anomaly.id,
      metric: anomaly.metric,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Execute API optimization
   */
  private async executeApiOptimization(anomaly: PerformanceAnomaly): Promise<void> {
    this.optimizationService.addStrategy({
      id: `autonomous-api-${anomaly.id}`,
      name: `Autonomous API Optimization for ${anomaly.metric}`,
      type: 'cache',
      priority: anomaly.severity === 'critical' ? 'critical' : 'high',
      description: `Automatically triggered optimization for ${anomaly.metric}`,
      conditions: [
        {
          metric: anomaly.metric,
          operator: '>',
          threshold: anomaly.expectedValue
        }
      ],
      actions: [
        {
          type: 'cache_config',
          target: anomaly.metric,
          parameters: {
            responseCaching: true,
            cdnCaching: true,
            ttl: 300
          },
          automated: true,
          rollbackPlan: 'Disable response caching'
        }
      ],
      expectedImpact: {
        performance: 30,
        resource: 15,
        reliability: 20
      },
      confidence: anomaly.confidence
    });
  }

  /**
   * Generate urgent scaling recommendation
   */
  private async generateUrgentScalingRecommendation(anomaly: PerformanceAnomaly): Promise<void> {
    const resourceType = this.inferResourceType(anomaly.metric);
    const urgency = anomaly.severity === 'critical' ? 'immediate' : 'planned';
    
    await this.recordLearningEvent('scaling_recommendation', {
      trigger: anomaly.id,
      resourceType,
      urgency,
      metric: anomaly.metric,
      value: anomaly.value,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Infer resource type from metric
   */
  private inferResourceType(metric: string): string {
    if (metric.includes('database') || metric.includes('query')) return 'database';
    if (metric.includes('cache')) return 'cache';
    if (metric.includes('api') || metric.includes('request')) return 'compute';
    return 'compute';
  }

  /**
   * Process performance recommendations and learn from them
   */
  async processRecommendations(recommendations: PerformanceRecommendation[]): Promise<void> {
    if (!this.config.enableSelfOptimization) return;

    for (const recommendation of recommendations) {
      await this.processRecommendation(recommendation);
    }
  }

  /**
   * Process individual recommendation
   */
  private async processRecommendation(recommendation: PerformanceRecommendation): Promise<void> {
    // Store recommendation in memory for learning
    await this.memoryService.storeFact(
      recommendation.type,
      'has_recommendation',
      `rec-${recommendation.type}-${Date.now()}`,
      {
        priority: recommendation.priority,
        impact: recommendation.impact,
        effort: recommendation.effort,
        actions: recommendation.actions,
        timestamp: new Date().toISOString()
      },
      new Date()
    );

    // Check if we have successful patterns for this type
    const successfulPatterns = await this.getSuccessfulPatterns(recommendation.type);
    
    if (successfulPatterns.length > 0) {
      await this.applyLearnedPattern(recommendation, successfulPatterns);
    } else {
      await this.executeStandardRecommendation(recommendation);
    }
  }

  /**
   * Get successful patterns for recommendation type
   */
  private async getSuccessfulPatterns(type: string): Promise<any[]> {
    const patterns = await this.memoryService.query({
      relationship: 'successful_pattern',
      subjectId: type
    });

    return patterns.map((p: any) => p.properties);
  }

  /**
   * Apply learned pattern to recommendation
   */
  private async applyLearnedPattern(
    recommendation: PerformanceRecommendation,
    patterns: any[]
  ): Promise<void> {
    const bestPattern = patterns[0]; // Use most successful pattern
    
    await this.recordLearningEvent('pattern_applied', {
      recommendationType: recommendation.type,
      patternId: bestPattern.id,
      successRate: bestPattern.successRate,
      timestamp: new Date().toISOString()
    });

    // Apply pattern modifications
    recommendation.actions = bestPattern.optimizedActions || recommendation.actions;
    await this.executeStandardRecommendation(recommendation);
  }

  /**
   * Execute standard recommendation
   */
  private async executeStandardRecommendation(
    recommendation: PerformanceRecommendation
  ): Promise<void> {
    // Add as optimization strategy if high priority
    if (recommendation.priority === 'high') {
      const strategy = this.convertRecommendationToStrategy(recommendation);
      this.optimizationService.addStrategy(strategy);
    }
  }

  /**
   * Convert recommendation to optimization strategy
   */
  private convertRecommendationToStrategy(
    recommendation: PerformanceRecommendation
  ): any {
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: recommendation.title,
      type: recommendation.type,
      priority: recommendation.priority,
      description: recommendation.description,
      conditions: [], // Would be derived from current metrics
      actions: recommendation.actions.map(action => ({
        type: action.includes('cache') ? 'cache_config' : 
              action.includes('database') ? 'query_optimize' : 'bundle_split',
        target: recommendation.type,
        parameters: { action },
        automated: recommendation.priority === 'high',
        rollbackPlan: 'Reverse optimization if performance degrades'
      })),
      expectedImpact: {
        performance: recommendation.impact === 'high' ? 30 : 20,
        resource: 15,
        reliability: 10
      },
      confidence: 0.8
    };
  }

  /**
   * Record learning event
   */
  private async recordLearningEvent(eventType: string, data: any): Promise<void> {
    if (!this.config.enableLearning) return;

    await this.memoryService.storeFact(
      'autonomous_performance',
      eventType,
      `event-${Date.now()}`,
      {
        ...data,
        timestamp: new Date().toISOString()
      },
      new Date()
    );

    // Update learning history
    if (!this.learningHistory.has(eventType)) {
      this.learningHistory.set(eventType, []);
    }
    this.learningHistory.get(eventType)!.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 events
    const events = this.learningHistory.get(eventType)!;
    if (events.length > 100) {
      events.shift();
    }
  }

  /**
   * Get learning analytics
   */
  getLearningAnalytics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    successRate: Record<string, number>;
    recentPatterns: any[];
  } {
    let totalEvents = 0;
    const eventsByType: Record<string, number> = {};
    const successRate: Record<string, number> = {};

    for (const [eventType, events] of this.learningHistory) {
      eventsByType[eventType] = events.length;
      totalEvents += events.length;

      // Calculate success rate
      const successful = events.filter(e => e.success || e.type?.includes('successful')).length;
      successRate[eventType] = events.length > 0 ? (successful / events.length) * 100 : 0;
    }

    return {
      totalEvents,
      eventsByType,
      successRate,
      recentPatterns: [] // Would be populated from memory service
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutonomousPerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutonomousPerformanceConfig {
    return { ...this.config };
  }

  /**
   * Get optimization service for advanced operations
   */
  getOptimizationService(): any {
    return this.optimizationService;
  }
}

// Factory function
export function createAutonomousPerformanceEnhancer(
  kv: any,
  memoryService: JasaWebTempMemory,
  config?: Partial<AutonomousPerformanceConfig>
): AutonomousPerformanceEnhancer {
  return new AutonomousPerformanceEnhancer(kv, memoryService, config);
}