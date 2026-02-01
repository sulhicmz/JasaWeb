/**
 * Background Job Service Configuration
 * Centralized configuration for all background job related values
 */

export const BACKGROUND_JOB_CONFIG = {
  // Timeout durations in milliseconds for different job types
  timeouts: {
    email: 100,        // Email sending simulation
    report: 5000,      // Report generation
    dataProcessing: 3000, // Data processing operations
    restart: 100,      // Service restart delay
  },
  
  // Default job settings
  defaults: {
    maxRetries: 3,     // Default number of retry attempts
    timeout: 300,      // Default job timeout in seconds
    priority: 0,       // Default priority
    delay: 0,          // Default delay before execution
  },
  
  // Service settings
  service: {
    maxConcurrentJobs: 5,  // Maximum jobs running simultaneously
    pollInterval: 1000,    // Job queue polling interval in ms
    retryDelay: 1000,      // Delay between retry attempts
  },
  
  // Job type estimated execution times (in seconds)
  estimatedTimes: {
    email: 2,
    report: 10,
    dataProcessing: 5,
  }
} as const;

// Type exports for TypeScript
export type BackgroundJobTimeouts = typeof BACKGROUND_JOB_CONFIG.timeouts;
export type BackgroundJobDefaults = typeof BACKGROUND_JOB_CONFIG.defaults;
export type BackgroundJobService = typeof BACKGROUND_JOB_CONFIG.service;
export type BackgroundJobEstimatedTimes = typeof BACKGROUND_JOB_CONFIG.estimatedTimes;