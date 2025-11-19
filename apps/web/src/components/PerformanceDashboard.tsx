import React, { useState, useEffect } from 'react';
import {
  performanceMonitor,
  WebVitals,
  PerformanceMetric,
} from '../services/performanceMonitor';

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
}) => {
  const [webVitals, setWebVitals] = useState<WebVitals>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setWebVitals(performanceMonitor.getWebVitals());
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'text-gray-600';

    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (metric: string, value: number): string => {
    switch (metric) {
      case 'cls':
        return value.toFixed(3);
      case 'lcp':
      case 'fcp':
      case 'ttfb':
      case 'page-load':
      case 'dom-content-loaded':
        return `${(value / 1000).toFixed(2)}s`;
      case 'fid':
      case 'long-task':
        return `${value.toFixed(0)}ms`;
      default:
        return value.toFixed(2);
    }
  };

  const getMetricGrade = (
    metric: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
    setWebVitals({
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 z-50 ${className}`}
        title="Show Performance Dashboard"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${className}`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Dashboard
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={clearMetrics}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Clear Metrics"
            >
              Clear
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Close Dashboard"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Core Web Vitals */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Core Web Vitals
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">LCP</span>
              <span
                className={`text-sm font-medium ${getMetricColor('lcp', webVitals.lcp)}`}
              >
                {formatValue('lcp', webVitals.lcp)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FID</span>
              <span
                className={`text-sm font-medium ${getMetricColor('fid', webVitals.fid)}`}
              >
                {formatValue('fid', webVitals.fid)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CLS</span>
              <span
                className={`text-sm font-medium ${getMetricColor('cls', webVitals.cls)}`}
              >
                {formatValue('cls', webVitals.cls)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FCP</span>
              <span
                className={`text-sm font-medium ${getMetricColor('fcp', webVitals.fcp)}`}
              >
                {formatValue('fcp', webVitals.fcp)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">TTFB</span>
              <span
                className={`text-sm font-medium ${getMetricColor('ttfb', webVitals.ttfb)}`}
              >
                {formatValue('ttfb', webVitals.ttfb)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Grades */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Performance Grades
          </h4>
          <div className="space-y-2">
            {Object.entries(webVitals).map(([metric, value]) => {
              if (value === 0) return null;
              const grade = getMetricGrade(metric, value);
              const gradeColors = {
                good: 'bg-green-100 text-green-800',
                'needs-improvement': 'bg-yellow-100 text-yellow-800',
                poor: 'bg-red-100 text-red-800',
              };

              return (
                <div key={metric} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 uppercase">
                    {metric}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${gradeColors[grade]}`}
                  >
                    {grade.replace('-', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Recent Metrics
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {metrics
              .slice(-10)
              .reverse()
              .map((metric, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-gray-600 truncate max-w-32">
                    {metric.name}
                  </span>
                  <span
                    className={`font-medium ${getMetricColor(metric.name, metric.value)}`}
                  >
                    {formatValue(metric.name, metric.value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
