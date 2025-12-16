// src/services/performanceService.ts
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
        console.log('LCP:', this.metrics.lcp);
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
          console.log('FID:', this.metrics.fid);
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
        console.log('CLS:', this.metrics.cls);
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
      console.log('Page Load Time:', this.metrics.pageLoad);
      console.log('DOM Content Loaded:', this.metrics.domContentLoaded);
    });
  }

  // Get all metrics
  getMetrics() {
    return this.metrics;
  }

  // Send metrics to analytics (placeholder)
  sendMetrics() {
    // In a real implementation, send to your analytics service
    console.log('Performance Metrics:', this.metrics);
  }
}

export default PerformanceService;
