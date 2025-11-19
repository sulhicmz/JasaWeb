interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
  }

  private initializeObservers(): void {
    // Observe Core Web Vitals
    this.observeWebVitals();

    // Observe long tasks
    this.observeLongTasks();

    // Observe resource timing
    this.observeResourceTiming();
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('cls', clsValue);
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        this.recordMetric('fcp', fcpEntry.startTime);
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(fcpObserver);
  }

  private observeLongTasks(): void {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('long-task', entry.duration);
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    this.observers.push(longTaskObserver);
  }

  private observeResourceTiming(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.recordMetric(`resource-${entry.name}`, entry.duration);
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  private trackPageLoad(): void {
    window.addEventListener('load', () => {
      // Time to First Byte (TTFB)
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('ttfb', ttfb);

        // Page load time
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        this.recordMetric('page-load', loadTime);

        // DOM content loaded
        const domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.navigationStart;
        this.recordMetric('dom-content-loaded', domContentLoaded);
      }
    });
  }

  private recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance warnings
    this.checkPerformanceThresholds(name, value);

    // Send metrics to analytics service (in production)
    if (import.meta.env.PROD) {
      this.sendMetricToAnalytics(metric);
    }
  }

  private checkPerformanceThresholds(name: string, value: number): void {
    const thresholds: Record<string, number> = {
      lcp: 2500, // Good LCP is < 2.5s
      fid: 100, // Good FID is < 100ms
      cls: 0.1, // Good CLS is < 0.1
      fcp: 1800, // Good FCP is < 1.8s
      ttfb: 800, // Good TTFB is < 800ms
      'page-load': 3000, // Good page load is < 3s
      'long-task': 50, // Long tasks are > 50ms
    };

    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      console.warn(
        `Performance warning: ${name} (${value.toFixed(2)}) exceeds threshold (${threshold})`
      );
    }
  }

  private sendMetricToAnalytics(metric: PerformanceMetric): void {
    // In a real implementation, this would send to your analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const existingMetrics = JSON.parse(
        localStorage.getItem('performance-metrics') || '[]'
      );
      existingMetrics.push(metric);

      // Keep only last 50 metrics in localStorage
      if (existingMetrics.length > 50) {
        existingMetrics.splice(0, existingMetrics.length - 50);
      }

      localStorage.setItem(
        'performance-metrics',
        JSON.stringify(existingMetrics)
      );
    } catch (error) {
      console.warn('Failed to store performance metrics:', error);
    }
  }

  public getWebVitals(): WebVitals {
    const getLatestMetric = (name: string): number => {
      const metric = this.metrics.findLast((m) => m.name === name);
      return metric?.value || 0;
    };

    return {
      lcp: getLatestMetric('lcp'),
      fid: getLatestMetric('fid'),
      cls: getLatestMetric('cls'),
      fcp: getLatestMetric('fcp'),
      ttfb: getLatestMetric('ttfb'),
    };
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getAverageMetric(name: string): number {
    const nameMetrics = this.metrics.filter((m) => m.name === name);
    if (nameMetrics.length === 0) return 0;

    const sum = nameMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / nameMetrics.length;
  }

  public clearMetrics(): void {
    this.metrics = [];
    try {
      localStorage.removeItem('performance-metrics');
    } catch (error) {
      console.warn('Failed to clear stored metrics:', error);
    }
  }

  public destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types for use in components
export type { PerformanceMetric, WebVitals };
export { PerformanceMonitor };
