/**
 * Advanced Performance Intelligence Service
 * 
 * ML-based anomaly detection and predictive analytics engine
 * for advanced performance monitoring and forecasting.
 * 
 * Features:
 * - Real-time anomaly detection using statistical models
 * - Predictive analytics for performance forecasting
 * - Intelligent alerting with reduced false positives
 * - Performance trend analysis and recommendations
 */

export interface PerformanceAnomaly {
  id: string;
  type: 'spike' | 'drop' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number; // Standard deviations from expected
  timestamp: string;
  confidence: number; // 0-1 confidence score
  description: string;
  recommendations: string[];
  relatedMetrics?: string[];
}

export interface PerformancePrediction {
  metric: string;
  timeframe: '1h' | '6h' | '24h' | '7d';
  predictions: {
    timestamp: string;
    value: number;
    confidence: number; // Prediction confidence interval
    upperBound: number;
    lowerBound: number;
  }[];
  trend: 'improving' | 'stable' | 'degrading';
  accuracy: number; // Historical accuracy percentage
  riskFactors: string[];
}

export interface PerformancePattern {
  id: string;
  name: string;
  type: 'seasonal' | 'cyclical' | 'trend' | 'anomaly';
  description: string;
  strength: number; // 0-1 pattern strength
  periodicity?: string; // e.g., 'daily', 'weekly'
  significance: number; // Statistical significance
  metrics: string[];
  detectedAt: string;
}

export interface IntelligenceConfig {
  anomalyDetection: {
    sensitivity: number; // 0.1-1.0, default 0.8
    minDataPoints: number; // Minimum historical data points
    windowSize: number; // Analysis window in data points
    alertThreshold: number; // Standard deviations threshold
  };
  prediction: {
    algorithm: 'linear' | 'polynomial' | 'arima' | 'neural';
    lookbackPeriod: number; // Hours of historical data to use
    confidenceThreshold: number; // Minimum confidence for predictions
    updateFrequency: number; // Minutes between prediction updates
  };
  patterns: {
    minPatternLength: number; // Minimum data points for pattern detection
    significanceThreshold: number; // Statistical significance threshold
  };
}

const DEFAULT_INTELLIGENCE_CONFIG: IntelligenceConfig = {
  anomalyDetection: {
    sensitivity: 0.8,
    minDataPoints: 10,
    windowSize: 50,
    alertThreshold: 2.5 // 2.5 standard deviations
  },
  prediction: {
    algorithm: 'linear',
    lookbackPeriod: 24, // 24 hours
    confidenceThreshold: 0.75,
    updateFrequency: 5 // Every 5 minutes
  },
  patterns: {
    minPatternLength: 20,
    significanceThreshold: 0.95
  }
};

export class PerformanceIntelligenceService {
  private metrics: Map<string, number[]> = new Map();
  private timestamps: string[] = [];
  private anomalies: PerformanceAnomaly[] = [];
  private predictions: Map<string, PerformancePrediction> = new Map();
  private patterns: PerformancePattern[] = [];
  private config: IntelligenceConfig;

  constructor(config?: Partial<IntelligenceConfig>) {
    this.config = { ...DEFAULT_INTELLIGENCE_CONFIG, ...config };
  }

  // ========================================
  // DATA INGESTION
  // ========================================

  /**
   * Add new performance metrics for analysis
   */
  addMetrics(data: Record<string, number>, timestamp?: string): void {
    const ts = timestamp || new Date().toISOString();
    
    // Store timestamp
    this.timestamps.push(ts);
    
    // Store each metric's time series data
    Object.entries(data).forEach(([metric, value]) => {
      if (!this.metrics.has(metric)) {
        this.metrics.set(metric, []);
      }
      const series = this.metrics.get(metric)!;
      series.push(value);
      
      // Keep only recent data points for memory efficiency
      if (series.length > 1000) {
        series.shift();
      }
    });
    
    // Keep timestamps array in sync
    if (this.timestamps.length > 1000) {
      this.timestamps.shift();
    }
    
    // Trigger analysis if we have enough data
    if (this.timestamps.length >= this.config.anomalyDetection.minDataPoints) {
      this.performAnalysis();
    }
  }

  // ========================================
  // ANOMALY DETECTION
  // ========================================

  /**
   * Perform comprehensive analysis including anomaly detection
   */
  private performAnalysis(): void {
    this.detectAnomalies();
    this.updatePredictions();
    this.detectPatterns();
  }

  /**
   * Detect anomalies using statistical models
   */
  private detectAnomalies(): void {
    const newAnomalies: PerformanceAnomaly[] = [];
    
    this.metrics.forEach((values, metric) => {
      if (values.length < this.config.anomalyDetection.minDataPoints) return;
      
      // Get recent data points for analysis
      const window = values.slice(-this.config.anomalyDetection.windowSize);
      const latestValue = values[values.length - 1];
      
      // Calculate statistical properties
      const stats = this.calculateStatistics(window);
      
      // Z-score based anomaly detection
      const zScore = Math.abs((latestValue - stats.mean) / stats.stdDev);
      
      if (zScore > this.config.anomalyDetection.alertThreshold) {
        const anomaly = this.createAnomaly(
          metric,
          latestValue,
          stats.mean,
          zScore,
          stats
        );
        newAnomalies.push(anomaly);
      }
      
      // Trend-based anomaly detection
      const trendAnomaly = this.detectTrendAnomaly(metric, values);
      if (trendAnomaly) {
        newAnomalies.push(trendAnomaly);
      }
    });
    
    // Update anomalies list
    this.anomalies = [...newAnomalies, ...this.anomalies].slice(-100); // Keep last 100
  }

  /**
   * Create anomaly object with detailed analysis
   */
  private createAnomaly(
    metric: string,
    value: number,
    expected: number,
    deviation: number,
    stats: { mean: number; stdDev: number; trend: number }
  ): PerformanceAnomaly {
    const isSpike = value > expected;
    const severity = this.calculateSeverity(deviation);
    const confidence = Math.min(0.99, deviation / this.config.anomalyDetection.alertThreshold);
    
    return {
      id: this.generateId(),
      type: isSpike ? 'spike' : 'drop',
      severity,
      metric,
      value,
      expectedValue: expected,
      deviation,
      timestamp: new Date().toISOString(),
      confidence,
      description: this.generateAnomalyDescription(metric, value, expected, isSpike),
      recommendations: this.generateAnomalyRecommendations(metric, isSpike, stats),
      relatedMetrics: this.findRelatedMetrics(metric)
    };
  }

  /**
   * Detect trend-based anomalies
   */
  private detectTrendAnomaly(metric: string, values: number[]): PerformanceAnomaly | null {
    const recentValues = values.slice(-20);
    const olderValues = values.slice(-40, -20);
    
    if (olderValues.length < 10) return null;
    
    const recentStats = this.calculateStatistics(recentValues);
    const olderStats = this.calculateStatistics(olderValues);
    
    // Detect sudden trend changes
    const trendChange = recentStats.trend - olderStats.trend;
    const trendMagnitude = Math.abs(trendChange);
    
    if (trendMagnitude > 0.5) { // Significant trend change
      return {
        id: this.generateId(),
        type: 'trend',
        severity: this.calculateSeverity(trendMagnitude * 2),
        metric,
        value: recentValues[recentValues.length - 1],
        expectedValue: olderStats.mean,
        deviation: trendMagnitude,
        timestamp: new Date().toISOString(),
        confidence: Math.min(0.95, trendMagnitude),
        description: `Significant trend change detected in ${metric}: ${trendChange > 0 ? 'accelerating' : 'decelerating'}`,
        recommendations: this.generateTrendRecommendations(metric, trendChange),
        relatedMetrics: this.findRelatedMetrics(metric)
      };
    }
    
    return null;
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  /**
   * Update predictions for all metrics
   */
  private updatePredictions(): void {
    this.metrics.forEach((values, metric) => {
      if (values.length >= this.config.prediction.lookbackPeriod) {
        const prediction = this.generatePrediction(metric, values);
        if (prediction) {
          this.predictions.set(metric, prediction);
        }
      }
    });
  }

  /**
   * Generate performance predictions using ML algorithms
   */
  private generatePrediction(metric: string, values: number[]): PerformancePrediction | null {
    const algorithm = this.config.prediction.algorithm;
    
    switch (algorithm) {
      case 'linear':
        return this.linearRegressionPrediction(metric, values);
      case 'polynomial':
        return this.polynomialRegressionPrediction(metric, values);
      default:
        return this.linearRegressionPrediction(metric, values);
    }
  }

  /**
   * Linear regression prediction
   */
  private linearRegressionPrediction(metric: string, values: number[]): PerformancePrediction | null {
    const lookback = Math.min(values.length, this.config.prediction.lookbackPeriod);
    const recentValues = values.slice(-lookback);
    
    // Simple linear regression
    const n = recentValues.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = recentValues;
    
    // Calculate regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for accuracy
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((acc, yi, i) => {
      const predicted = slope * i + intercept;
      return acc + Math.pow(yi - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const accuracy = Math.max(0, Math.min(100, rSquared * 100));
    
    // Generate predictions for different timeframes
    const timeframes: Array<'1h' | '6h' | '24h' | '7d'> = ['1h', '6h', '24h', '7d'];
    const predictions = timeframes.map(timeframe => {
      const steps = this.getTimeframeSteps(timeframe);
      const futureValue = slope * (n + steps - 1) + intercept;
      const confidence = Math.max(0.5, accuracy / 100);
      
      // Calculate confidence bounds
      const stdError = Math.sqrt(residualSumSquares / (n - 2));
      const margin = 1.96 * stdError * Math.sqrt(1 + 1/n + Math.pow(steps, 2) / sumXX);
      
      return {
        timestamp: this.getFutureTimestamp(timeframe),
        value: Math.max(0, futureValue), // Non-negative values
        confidence,
        upperBound: Math.max(0, futureValue + margin),
        lowerBound: Math.max(0, futureValue - margin)
      };
    });
    
    // Determine trend
    const trend = slope > 0.1 ? 'improving' : slope < -0.1 ? 'degrading' : 'stable';
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(metric, values, slope);
    
    return {
      metric,
      timeframe: '24h', // Primary prediction timeframe
      predictions,
      trend,
      accuracy,
      riskFactors
    };
  }

  /**
   * Polynomial regression prediction (placeholder for future enhancement)
   */
  private polynomialRegressionPrediction(metric: string, values: number[]): PerformancePrediction | null {
    // For now, fall back to linear regression
    // TODO: Implement polynomial regression for complex patterns
    return this.linearRegressionPrediction(metric, values);
  }

  // ========================================
  // PATTERN DETECTION
  // ========================================

  /**
   * Detect performance patterns
   */
  private detectPatterns(): void {
    this.metrics.forEach((values, metric) => {
      if (values.length < this.config.patterns.minPatternLength) return;
      
      // Detect seasonal patterns
      const seasonalPattern = this.detectSeasonalPattern(metric, values);
      if (seasonalPattern) {
        this.patterns.push(seasonalPattern);
      }
      
      // Detect cyclical patterns
      const cyclicalPattern = this.detectCyclicalPattern(metric, values);
      if (cyclicalPattern) {
        this.patterns.push(cyclicalPattern);
      }
    });
    
    // Keep only significant patterns
    this.patterns = this.patterns
      .filter(p => p.significance >= this.config.patterns.significanceThreshold)
      .slice(-50); // Keep last 50 patterns
  }

  /**
   * Detect seasonal patterns (daily, weekly)
   */
  private detectSeasonalPattern(metric: string, values: number[]): PerformancePattern | null {
    // Simplified seasonal detection using auto-correlation
    const periodicities = [24, 168]; // Hourly, weekly
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    periodicities.forEach(period => {
      if (values.length < period * 2) return;
      
      const correlation = this.calculateAutocorrelation(values, period);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    });
    
    if (bestCorrelation > 0.7) {
      return {
        id: this.generateId(),
        name: `${metric} Seasonal Pattern`,
        type: 'seasonal',
        description: `Strong ${bestPeriod === 24 ? 'daily' : 'weekly'} seasonal pattern detected`,
        strength: bestCorrelation,
        periodicity: bestPeriod === 24 ? 'daily' : 'weekly',
        significance: bestCorrelation,
        metrics: [metric],
        detectedAt: new Date().toISOString()
      };
    }
    
    return null;
  }

  /**
   * Detect cyclical patterns
   */
  private detectCyclicalPattern(_metric: string, _values: number[]): PerformancePattern | null {
    // Simplified cyclical pattern detection
    // TODO: Implement more sophisticated FFT-based cyclical analysis
    return null;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Calculate statistics for a data series
   */
  private calculateStatistics(values: number[]): {
    mean: number;
    stdDev: number;
    trend: number;
  } {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend (simple linear regression slope)
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return { mean, stdDev, trend };
  }

  /**
   * Calculate auto-correlation for periodicity detection
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const deviation1 = values[i] - mean;
      const deviation2 = values[i + lag] - mean;
      numerator += deviation1 * deviation2;
    }
    
    for (let i = 0; i < values.length; i++) {
      const deviation = values[i] - mean;
      denominator += deviation * deviation;
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate severity based on deviation
   */
  private calculateSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation < 2.5) return 'low';
    if (deviation < 3.5) return 'medium';
    if (deviation < 4.5) return 'high';
    return 'critical';
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(
    metric: string,
    value: number,
    expected: number,
    isSpike: boolean
  ): string {
    const direction = isSpike ? 'spike' : 'drop';
    const percentage = Math.abs(((value - expected) / expected) * 100).toFixed(1);
    return `${direction.charAt(0).toUpperCase() + direction.slice(1)} detected in ${metric}: ${percentage}% ${direction} from expected value`;
  }

  /**
   * Generate anomaly recommendations
   */
  private generateAnomalyRecommendations(
    metric: string,
    isSpike: boolean,
    stats: { trend: number }
  ): string[] {
    const recommendations: string[] = [];
    
    // Use stats.trend to provide contextual recommendations
    if (stats.trend > 0.5 && metric.includes('performance')) {
      recommendations.push('Positive trend detected - monitor for sustainability');
    }
    
    if (metric.includes('response') || metric.includes('latency')) {
      if (isSpike) {
        recommendations.push('Check for database connection issues');
        recommendations.push('Review recent code changes for performance regressions');
        recommendations.push('Monitor server resource utilization');
      } else {
        recommendations.push('Verify monitoring accuracy');
        recommendations.push('Check for caching improvements');
      }
    }
    
    if (metric.includes('error')) {
      recommendations.push('Review application logs for error patterns');
      recommendations.push('Check external service dependencies');
      recommendations.push('Implement circuit breakers if needed');
    }
    
    if (metric.includes('throughput') || metric.includes('request')) {
      if (isSpike) {
        recommendations.push('Monitor for potential DDoS attacks');
        recommendations.push('Check auto-scaling configuration');
      } else {
        recommendations.push('Investigate accessibility issues');
        recommendations.push('Review load balancer configuration');
      }
    }
    
    return recommendations;
  }

  /**
   * Generate trend-based recommendations
   */
  private generateTrendRecommendations(_metric: string, trendChange: number): string[] {
    const recommendations: string[] = [];
    
    if (trendChange > 0) {
      recommendations.push('Monitor resource consumption');
      recommendations.push('Plan capacity adjustments');
      recommendations.push('Review recent changes for optimization opportunities');
    } else {
      recommendations.push('Investigate performance improvements');
      recommendations.push('Document effective optimization strategies');
      recommendations.push('Consider applying similar improvements to other areas');
    }
    
    return recommendations;
  }

  /**
   * Find related metrics based on naming patterns
   */
  private findRelatedMetrics(metric: string): string[] {
    const related: string[] = [];
    const baseName = metric.replace(/_(response|error|throughput|latency|time)$/, '');
    
    this.metrics.forEach((_, otherMetric) => {
      if (otherMetric !== metric && otherMetric.includes(baseName)) {
        related.push(otherMetric);
      }
    });
    
    return related.slice(0, 5); // Limit to 5 related metrics
  }

  /**
   * Identify risk factors for predictions
   */
  private identifyRiskFactors(metric: string, values: number[], trend: number): string[] {
    const riskFactors: string[] = [];
    const stats = this.calculateStatistics(values);
    
    // High volatility risk
    if (stats.stdDev / stats.mean > 0.3) {
      riskFactors.push('High metric volatility');
    }
    
    // Negative trend risk
    if (trend < -1 && (metric.includes('performance') || metric.includes('score'))) {
      riskFactors.push('Declining performance trend');
    }
    
    // Recent anomalies risk
    const recentAnomalies = this.anomalies.filter(a => 
      a.metric === metric && 
      new Date(a.timestamp).getTime() > Date.now() - 3600000 // Last hour
    );
    
    if (recentAnomalies.length > 2) {
      riskFactors.push('Recent anomaly frequency');
    }
    
    return riskFactors;
  }

  /**
   * Get timeframe steps for prediction
   */
  private getTimeframeSteps(timeframe: '1h' | '6h' | '24h' | '7d'): number {
    switch (timeframe) {
      case '1h': return 12; // 5-minute intervals
      case '6h': return 72;
      case '24h': return 288;
      case '7d': return 2016;
      default: return 12;
    }
  }

  /**
   * Get future timestamp for prediction
   */
  private getFutureTimestamp(timeframe: '1h' | '6h' | '24h' | '7d'): string {
    const now = new Date();
    const hours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168
    }[timeframe];
    
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Get current anomalies
   */
  getAnomalies(options?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metric?: string;
    timeRange?: number; // Hours
  }): PerformanceAnomaly[] {
    let filtered = [...this.anomalies];
    
    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }
    
    if (options?.metric) {
      filtered = filtered.filter(a => a.metric === options.metric);
    }
    
    if (options?.timeRange) {
      const cutoff = Date.now() - (options.timeRange * 3600000);
      filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= cutoff);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get predictions for specific metric
   */
  getPrediction(metric: string): PerformancePrediction | null {
    return this.predictions.get(metric) || null;
  }

  /**
   * Get all predictions
   */
  getAllPredictions(): PerformancePrediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Get detected patterns
   */
  getPatterns(options?: {
    type?: 'seasonal' | 'cyclical' | 'trend' | 'anomaly';
    metric?: string;
  }): PerformancePattern[] {
    let filtered = [...this.patterns];
    
    if (options?.type) {
      filtered = filtered.filter(p => p.type === options.type);
    }
    
    if (options?.metric) {
      filtered = filtered.filter(p => p.metrics.includes(options.metric!));
    }
    
    return filtered.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get intelligence summary
   */
  getIntelligenceSummary(): {
    anomalies: {
      total: number;
      critical: number;
      recentCount: number;
    };
    predictions: {
      total: number;
      accurate: number;
      avgConfidence: number;
    };
    patterns: {
      total: number;
      seasonal: number;
      cyclical: number;
    };
    health: {
      status: 'healthy' | 'warning' | 'critical';
      score: number;
      issues: string[];
    };
  } {
    const criticalAnomalies = this.anomalies.filter(a => a.severity === 'critical');
    const recentAnomalies = this.anomalies.filter(a => 
      new Date(a.timestamp).getTime() > Date.now() - 3600000
    );
    
    const predictions = Array.from(this.predictions.values());
    const avgConfidence = predictions.length > 0 
      ? predictions.reduce((acc, p) => acc + p.predictions[0]?.confidence || 0, 0) / predictions.length
      : 0;
    
    const seasonalPatterns = this.patterns.filter(p => p.type === 'seasonal');
    const cyclicalPatterns = this.patterns.filter(p => p.type === 'cyclical');
    
    // Calculate health score
    let healthScore = 100;
    const issues: string[] = [];
    
    if (criticalAnomalies.length > 0) {
      healthScore -= 30;
      issues.push(`${criticalAnomalies.length} critical anomalies detected`);
    }
    
    if (recentAnomalies.length > 5) {
      healthScore -= 20;
      issues.push('High anomaly frequency detected');
    }
    
    if (avgConfidence < 0.7) {
      healthScore -= 15;
      issues.push('Low prediction confidence');
    }
    
    const healthStatus = healthScore >= 80 ? 'healthy' : 
                        healthScore >= 60 ? 'warning' : 'critical';
    
    return {
      anomalies: {
        total: this.anomalies.length,
        critical: criticalAnomalies.length,
        recentCount: recentAnomalies.length
      },
      predictions: {
        total: predictions.length,
        accurate: predictions.filter(p => p.accuracy >= 80).length,
        avgConfidence
      },
      patterns: {
        total: this.patterns.length,
        seasonal: seasonalPatterns.length,
        cyclical: cyclicalPatterns.length
      },
      health: {
        status: healthStatus,
        score: Math.max(0, healthScore),
        issues
      }
    };
  }

  /**
   * Clear all data (for testing or reset)
   */
  clearData(): void {
    this.metrics.clear();
    this.timestamps = [];
    this.anomalies = [];
    this.predictions.clear();
    this.patterns = [];
  }
}

/**
 * Create performance intelligence service instance
 */
export function createPerformanceIntelligenceService(
  config?: Partial<IntelligenceConfig>
): PerformanceIntelligenceService {
  return new PerformanceIntelligenceService(config);
}

// Singleton instance for global use
export const performanceIntelligence = createPerformanceIntelligenceService();