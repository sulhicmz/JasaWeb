// src/services/performanceService.ts
// Simple logger fallback for web app
const logger = {
  debug: (message: string, data?: Record<string, unknown>) =>
    console.debug(`[DEBUG] ${message}`, data),
  info: (message: string, data?: Record<string, unknown>) =>
    console.info(`[INFO] ${message}`, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    console.warn(`[WARN] ${message}`, data),
  error: (message: string, error?: Error | Record<string, unknown>) =>
    console.error(`[ERROR] ${message}`, error),
  performance: (
    metric: string,
    value: number,
    details?: Record<string, unknown>
  ) => console.info(`[PERF] ${metric}: ${value}ms`, details),
};

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: { [key: string]: number } = {};

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Measure Core Web Vitals
  measureCoreWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry?.startTime || 0;
        logger.performance('LCP', this.metrics.lcp, {
          metricType: 'largest-contentful-paint',
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformancePaintTiming & {
            processingStart: number;
          };
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
          logger.performance('FID', this.metrics.fid, {
            metricType: 'first-input',
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            this.metrics.cls = clsValue;
          }
        });
        logger.performance('CLS', this.metrics.cls || 0, {
          metricType: 'layout-shift',
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Measure page load time
  measurePageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
      logger.performance('Page Load Time', this.metrics.pageLoad, {
        metricType: 'navigation',
      });
      logger.performance('DOM Content Loaded', this.metrics.domContentLoaded, {
        metricType: 'navigation',
      });
    });
  }

  // Get all metrics
  getMetrics() {
    return this.metrics;
  }

  // Send metrics to analytics (placeholder)
  sendMetrics() {
    // In a real implementation, send to your analytics service
    logger.info('Performance Metrics collected', this.metrics);
  }
}

export default PerformanceService;
