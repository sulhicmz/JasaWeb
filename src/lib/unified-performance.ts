import type { KVNamespace } from '@/lib/types';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/kv';
import { performanceIntelligence, type PerformanceAnomaly, type PerformancePrediction } from './performance-intelligence';

interface UnifiedCacheConfig {
  metricsTTL: number;
  statsTTL: number;
  anomaliesTTL: number;
  predictionsTTL: number;
}

const DEFAULT_CACHE_CONFIG: UnifiedCacheConfig = {
  metricsTTL: 60,
  statsTTL: 300,
  anomaliesTTL: 600,
  predictionsTTL: 1800,
};

export class UnifiedPerformanceService {
  private kv: KVNamespace;
  private config: UnifiedCacheConfig;

  constructor(kv: KVNamespace, config?: Partial<UnifiedCacheConfig>) {
    this.kv = kv;
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  async getMetrics(useCache = true): Promise<any> {
    const cacheKey = 'perf:metrics';
    
    if (useCache) {
      const cached = await cacheGet<any>(this.kv, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const metrics = { timestamp: new Date().toISOString() };
    await cacheSet(this.kv, cacheKey, metrics, { ttl: this.config.metricsTTL });
    
    return metrics;
  }

  async getAnomalies(useCache = true): Promise<PerformanceAnomaly[]> {
    const cacheKey = 'perf:anomalies';
    
    if (useCache) {
      const cached = await cacheGet<PerformanceAnomaly[]>(this.kv, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const anomalies = performanceIntelligence.getAnomalies();
    await cacheSet(this.kv, cacheKey, anomalies, { ttl: this.config.anomaliesTTL });
    
    return anomalies;
  }

  async getPredictions(metric: string, useCache = true): Promise<PerformancePrediction | null> {
    const cacheKey = `perf:prediction:${metric}`;
    
    if (useCache) {
      const cached = await cacheGet<PerformancePrediction>(this.kv, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const prediction = performanceIntelligence.getPrediction(metric);
    if (prediction) {
      await cacheSet(this.kv, cacheKey, prediction, { ttl: this.config.predictionsTTL });
    }
    
    return prediction;
  }

  async getPerformanceSummary(): Promise<{
    metrics: any;
    anomalies: PerformanceAnomaly[];
    criticalIssues: PerformanceAnomaly[];
    predictions: PerformancePrediction[];
    healthScore: number;
    lastUpdated: string;
  }> {
    const [metrics, anomalies] = await Promise.all([
      this.getMetrics(),
      this.getAnomalies()
    ]);

    const criticalIssues = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
    const healthScore = Math.max(0, 100 - (criticalIssues.length * 10));

    const predictionPromises = ['api.latency', 'database.queryTime', 'cache.hitRate'].map(
      metric => this.getPredictions(metric)
    );
    const predictions = (await Promise.all(predictionPromises)).filter(Boolean) as PerformancePrediction[];

    return {
      metrics,
      anomalies,
      criticalIssues,
      predictions,
      healthScore,
      lastUpdated: new Date().toISOString()
    };
  }

  async invalidateCache(): Promise<void> {
    const keys = [
      'perf:metrics',
      'perf:anomalies',
      'perf:prediction:api.latency',
      'perf:prediction:database.queryTime',
      'perf:prediction:cache.hitRate'
    ];

    await Promise.all(keys.map(key => cacheDelete(this.kv, key)));
  }

  async recordEvent(event: {
    type: 'metric' | 'anomaly' | 'prediction';
    data: any;
  }): Promise<void> {
    switch (event.type) {
      case 'metric':
        break;
      case 'anomaly':
        await cacheDelete(this.kv, 'perf:anomalies');
        break;
      case 'prediction':
        await cacheDelete(this.kv, `perf:prediction:${event.data.metric}`);
        break;
    }
  }
}

let unifiedPerformanceService: UnifiedPerformanceService | null = null;

export function getUnifiedPerformanceService(kv: KVNamespace): UnifiedPerformanceService {
  if (!unifiedPerformanceService) {
    unifiedPerformanceService = new UnifiedPerformanceService(kv);
  }
  return unifiedPerformanceService;
}