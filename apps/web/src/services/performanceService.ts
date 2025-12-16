// src/services/performanceService.ts
import { logger } from '@jasaweb/config';

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
        this.metrics.lcp = lastEntry.startTime;
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
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
        logger.performance('CLS', this.metrics.cls, {
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
