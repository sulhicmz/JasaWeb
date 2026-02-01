/**
 * Application Timeout and Interval Constants
 * 
 * Centralized configuration for all timeouts, intervals, and timing-related
 * values to ensure consistency across the application.
 */

export const TIMEOUTS = {
  // WebSocket timing
  WEBSOCKET: {
    RECONNECT_INTERVAL: 3000,        // 3 seconds between reconnection attempts
    HEARTBEAT_INTERVAL: 30000,       // 30 seconds heartbeat
    CONNECTION_TIMEOUT: 30000,       // 30 seconds connection timeout
    MAX_RECONNECT_ATTEMPTS: 5,       // Maximum reconnection attempts
  },

  // Performance monitoring thresholds (in milliseconds)
  PERFORMANCE: {
    SLOW_REQUEST_THRESHOLD: 2000,    // 2 seconds
    CRITICAL_REQUEST_THRESHOLD: 5000, // 5 seconds
    API_RESPONSE_TIMEOUT: 5000,      // 5 seconds max for API responses
    OPTIMIZATION_EFFECT_DELAY: 5000, // 5 seconds wait for optimization changes
  },

  // Background job timing
  JOBS: {
    DEFAULT_TIMEOUT: 30000,          // 30 seconds default job timeout
    REPORT_GENERATION_TIMEOUT: 5000, // 5 seconds for reports
    DATA_PROCESSING_TIMEOUT: 3000,   // 3 seconds for data processing
    POLLING_INTERVAL: 5000,          // 5 seconds polling interval
  },

  // Cache timing (in seconds)
  CACHE: {
    DEFAULT_TTL: 300,                // 5 minutes
    SHORT_TTL: 60,                   // 1 minute
    LONG_TTL: 3600,                  // 1 hour
    DASHBOARD_STATS_TTL: 300,        // 5 minutes for dashboard stats
    RECENT_DATA_TTL: 180,            // 3 minutes for recent data
    AGGREGATION_TTL: 600,            // 10 minutes for aggregations
  },

  // Rate limiting windows (in milliseconds)
  RATE_LIMIT: {
    DEFAULT_WINDOW: 60000,           // 1 minute
    AUTH_WINDOW: 900000,             // 15 minutes for auth endpoints
    WEBSOCKET_MESSAGE_WINDOW: 60000, // 1 minute for WebSocket messages
  },

  // Dashboard refresh intervals (in milliseconds)
  DASHBOARD: {
    PERFORMANCE_REFRESH: 30000,      // 30 seconds
    JOBS_REFRESH: 5000,              // 5 seconds for job queue
    NOTIFICATION_REFRESH: 60000,     // 1 minute for notifications
  },

  // Optimization engine timing
  OPTIMIZATION: {
    CYCLE_INTERVAL: 300000,          // 5 minutes between optimization cycles
    SLEEP_AFTER_OPTIMIZATION: 5000,  // 5 seconds wait after optimization
  },

  // Test timeouts
  TEST: {
    DEFAULT_TIMEOUT: 10000,          // 10 seconds default test timeout
    PERFORMANCE_TEST_TIMEOUT: 10000, // 10 seconds for performance tests
  },
} as const;

// Helper function to get timeout with optional override
export function getTimeout(
  category: keyof typeof TIMEOUTS,
  key: keyof typeof TIMEOUTS[keyof typeof TIMEOUTS],
  override?: number
): number {
  if (override !== undefined) return override;
  return (TIMEOUTS[category] as Record<string, number>)[key as string] ?? 0;
}

// Helper to convert milliseconds to seconds for cache TTL
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

// Helper to convert seconds to milliseconds
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}
