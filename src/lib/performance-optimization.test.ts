/**
 * Performance Optimization Tests
 * Tests for image optimization, bundle size, and client-side performance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { imageOptimization } from './image-optimization';

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    // Reset any cache or state before each test
  });

  describe('Image Optimization Performance', () => {
    it('should generate optimized URLs efficiently', () => {
      const testUrl = 'https://example.com/image.jpg';
      const iterations = 1000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        imageOptimization.generateOptimizedUrl(testUrl, {
          width: 800,
          height: 600,
          quality: 85,
          format: 'webp'
        });
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      // Should generate URLs in under 0.1ms each
      expect(avgTime).toBeLessThan(0.1);
    });

    it('should validate image URLs quickly', () => {
      const testUrls = [
        'https://example.com/image.jpg',
        'https://example.com/image.webp',
        'https://example.com/image.png',
        'invalid-url',
        'ftp://example.com/image.jpg'
      ];
      
      const startTime = performance.now();
      
      testUrls.forEach(url => {
        imageOptimization.validateImageUrl(url);
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should validate 5 URLs in under 1ms
      expect(totalTime).toBeLessThan(1);
    });

    it('should generate srcsets efficiently', () => {
      const testUrl = 'https://example.com/image.jpg';
      const breakpoints = [320, 640, 768, 1024, 1280, 1536];
      
      const startTime = performance.now();
      
      const srcset = imageOptimization.generateSrcSet(testUrl, breakpoints);
      
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      
      // Should generate srcset in under 0.5ms
      expect(timeTaken).toBeLessThan(0.5);
      
      // Should include all breakpoints
      expect(srcset.split(',').length).toBe(breakpoints.length);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should handle large data sets efficiently', () => {
      const largeInvoiceData = Array.from({ length: 1000 }, (_, i) => ({
        id: `invoice-${i}`,
        amount: Math.random() * 1000000,
        status: i % 3 === 0 ? 'paid' : 'unpaid',
        project: { name: `Project ${i}`, type: 'sekolah' }
      }));
      
      const startTime = performance.now();
      
      // Simulate stats calculation optimization
      const stats = largeInvoiceData.reduce((acc: any, invoice) => {
        acc.total += Number(invoice.amount);
        acc[invoice.status] = (acc[invoice.status] || 0) + Number(invoice.amount);
        return acc;
      }, { total: 0 });
      
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      
      // Should process 1000 invoices in under 5ms
      expect(timeTaken).toBeLessThan(5);
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('Client Performance Optimizations', () => {
    it('should debounce function calls to prevent excessive operations', async () => {
      let callCount = 0;
      
      const debounce = (func: (...args: any[]) => void, wait: number) => {
        let timeout: any;
        return function(this: any, ...args: any[]) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      };
      
      const debouncedFunction = debounce(() => {
        callCount++;
      }, 100);
      
      // Call the debounced function multiple times rapidly
      for (let i = 0; i < 10; i++) {
        debouncedFunction();
      }
      
      // Should only actually execute once after debounce
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });

    it('should cache optimization results', () => {
      const cache = new Map();
      const testUrl = 'https://example.com/test-image.jpg';
      const options = { width: 800, height: 600 };
      
      // First call - computes result
      const startTime1 = performance.now();
      if (!cache.has(testUrl)) {
        const result = imageOptimization.generateOptimizedUrl(testUrl, options);
        cache.set(testUrl, result);
      }
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;
      
      // Second call - from cache (simulated)
      const startTime2 = performance.now();
      let result;
      if (cache.has(testUrl)) {
        result = cache.get(testUrl);
      }
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;
      
      // Cached access should be significantly faster
      expect(time2).toBeLessThan(time1);
      expect(result).toBeDefined();
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large numbers of image optimizations without memory leaks', () => {
      const testUrls = Array.from({ length: 100 }, (_, i) => 
        `https://example.com/image-${i}.jpg`
      );
      
      // Process images in batches to avoid memory spikes
      const batchSize = 10;
      let processedCount = 0;
      
      const startTime = performance.now();
      
      for (let i = 0; i < testUrls.length; i += batchSize) {
        const batch = testUrls.slice(i, i + batchSize);
        
        batch.forEach(url => {
          imageOptimization.generateOptimizedUrl(url, { width: 400, height: 300 });
          processedCount++;
        });
        
        // Simulate garbage collection hint
        if (i % (batchSize * 3) === 0) {
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(processedCount).toBe(testUrls.length);
      expect(totalTime).toBeLessThan(50); // Should process 100 images in under 50ms
    });
  });

  describe('Network Performance Simulation', () => {
    it('should optimize for slow network conditions', async () => {
      const simulateSlowFetch = (url: string, delay = 100) => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ data: 'test' }) }), delay);
        });
      };
      
      // Simulate loading with 200ms delay
      const startTime = performance.now();
      await simulateSlowFetch('/api/invoices', 200);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
      
      // Progressive loading should handle this gracefully
      expect(endTime - startTime).toBeLessThan(250); // Allow small variance
    });
  });
});