/**
 * Image Optimization Service Tests
 * Tests for Cloudflare Workers-based image optimization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageOptimization, generateOptimizedUrl, generateSrcSet, createOptimizedImageAttrs } from './image-optimization';

describe('ImageOptimizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOptimizedUrl', () => {
    it('should generate optimized URL with default options', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const result = imageOptimization.generateOptimizedUrl(originalUrl);
      
      expect(result).toContain('width=2048');
      expect(result).toContain('height=2048');
      expect(result).toContain('quality=80');
      expect(result).toContain('fit=cover');
      expect(result).toContain('gravity=center');
      expect(result).toContain('format=webp');
    });

    it('should accept custom options', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const options = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'avif' as const,
        fit: 'contain' as const
      };
      
      const result = imageOptimization.generateOptimizedUrl(originalUrl, options);
      
      expect(result).toContain('width=800');
      expect(result).toContain('height=600');
      expect(result).toContain('quality=90');
      expect(result).toContain('fit=contain');
      expect(result).toContain('format=avif');
    });

    it('should limit dimensions to max size', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const options = {
        width: 3000,
        height: 4000
      };
      
      const result = imageOptimization.generateOptimizedUrl(originalUrl, options);
      
      expect(result).toContain('width=2048');
      expect(result).toContain('height=2048');
    });

    it('should return original URL on error', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = imageOptimization.generateOptimizedUrl(invalidUrl);
      
      expect(result).toBe(invalidUrl);
    });

    it('should add cache-busting in development', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = imageOptimization.generateOptimizedUrl(originalUrl);
      
      expect(result).toContain('v=');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateSrcSet', () => {
    it('should generate srcset with default breakpoints', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const result = imageOptimization.generateSrcSet(originalUrl);
      
      expect(result).toContain('320w');
      expect(result).toContain('640w');
      expect(result).toContain('768w');
      expect(result).toContain('1024w');
      expect(result).toContain('1280w');
      expect(result).toContain('1536w');
    });

    it('should generate srcset with custom breakpoints', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const breakpoints = [400, 800, 1200];
      const result = imageOptimization.generateSrcSet(originalUrl, breakpoints);
      
      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).toContain('1200w');
      expect(result).not.toContain('320w');
    });

    it('should return original URL on error', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = imageOptimization.generateSrcSet(invalidUrl);
      
      // generateSrcSet will return the original URL for invalid inputs
      expect(result).toBe(invalidUrl);
    });
  });

  describe('generateSizes', () => {
    it('should generate sizes from array', () => {
      const sizes = ['100vw', '(max-width: 768px) 50vw', '300px'];
      const result = imageOptimization.generateSizes(sizes);
      
      expect(result).toBe('100vw, (max-width: 768px) 50vw, 300px');
    });

    it('should use default sizes', () => {
      const result = imageOptimization.generateSizes();
      
      expect(result).toBe('100vw');
    });
  });

  describe('createOptimizedImageAttrs', () => {
    it('should create basic image attributes', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const result = imageOptimization.createOptimizedImageAttrs(originalUrl, alt);
      
      expect(result.src).toContain('width=2048');
      expect(result.alt).toBe('Test image');
      expect(result.loading).toBe('lazy');
      expect(result.decoding).toBe('async');
    });

    it('should include dimensions when provided', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const options = {
        width: 800,
        height: 600
      };
      const result = imageOptimization.createOptimizedImageAttrs(originalUrl, alt, options);
      
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should include responsive attributes for larger images', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const options = {
        width: 800
      };
      const result = imageOptimization.createOptimizedImageAttrs(originalUrl, alt, options);
      
      expect(result.srcset).toBeDefined();
      expect(result.sizes).toBeDefined();
      expect(result.srcset).toContain('320w');
    });

    it('should not include responsive attributes for small images', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const options = {
        width: 300
      };
      const result = imageOptimization.createOptimizedImageAttrs(originalUrl, alt, options);
      
      expect(result.srcset).toBeUndefined();
      expect(result.sizes).toBeUndefined();
    });

    it('should accept custom loading and decoding options', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const options = {
        loading: 'eager' as const,
        decoding: 'sync' as const,
        class: 'custom-class'
      };
      const result = imageOptimization.createOptimizedImageAttrs(originalUrl, alt, options);
      
      expect(result.loading).toBe('eager');
      expect(result.decoding).toBe('sync');
      expect(result.class).toBe('custom-class');
    });
  });

  describe('validateImageUrl', () => {
    it('should validate valid image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'https://example.com/image.png',
        'https://example.com/image.webp',
        'https://example.com/image.avif',
        'https://example.com/image.jpeg',
        'https://cdn.example.com/path/to/image.webp?v=123'
      ];

      validUrls.forEach(url => {
        const result = imageOptimization.validateImageUrl(url);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        null as any,
        undefined as any,
        'not-a-url',
        'ftp://example.com/image.jpg',
        'https://example.com/file.txt',
        'https://example.com/document.pdf',
        'mailto:test@example.com'
      ];

      invalidUrls.forEach(url => {
        const result = imageOptimization.validateImageUrl(url);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('getImageInfo', () => {
    it('should return image info for valid URL', async () => {
      const url = 'https://example.com/image.jpg';
      const info = await imageOptimization.getImageInfo(url);
      
      expect(info).toBeDefined();
      expect(info!.width).toBe(800);
      expect(info!.height).toBe(600);
      expect(info!.format).toBe('jpeg');
      expect(info!.size).toBeGreaterThan(0);
    });

    it('should handle different image formats', async () => {
      const formats = [
        { url: 'https://example.com/image.png', format: 'png' },
        { url: 'https://example.com/image.webp', format: 'webp' },
        { url: 'https://example.com/image.avif', format: 'avif' },
        { url: 'https://example.com/image.jpg', format: 'jpeg' }
      ];

      for (const { url, format } of formats) {
        const info = await imageOptimization.getImageInfo(url);
        expect(info).toBeDefined();
        expect(info!.format).toBe(format);
      }
    });

    it('should return null for invalid URL', async () => {
      const url = 'not-a-valid-url';
      const info = await imageOptimization.getImageInfo(url);
      
      expect(info).toBeNull();
    });
  });

  describe('generatePlaceholder', () => {
    it('should generate placeholder SVG', () => {
      const result = imageOptimization.generatePlaceholder();
      
      expect(result).toContain('data:image/svg+xml;base64,');
      // Check for "Loading..." in the base64 string (it gets encoded)
      const decoded = atob(result.split(',')[1]);
      expect(decoded).toContain('Loading...');
    });

    it('should accept custom dimensions and color', () => {
      const result = imageOptimization.generatePlaceholder(200, 150, '#ff0000');
      
      expect(result).toContain('data:image/svg+xml;base64,');
      // Check for custom parameters in decoded SVG
      const decoded = atob(result.split(',')[1]);
      expect(decoded).toContain('width="200"');
      expect(decoded).toContain('height="150"');
      expect(decoded).toContain('fill="#ff0000"');
    });
  });

  describe('getOptimizationStats', () => {
    it('should calculate optimization statistics', () => {
      const originalSize = 500000; // 500KB
      const optimizedSize = 150000; // 150KB
      const originalFormat = 'jpeg';
      const optimizedFormat = 'webp';
      
      const stats = imageOptimization.getOptimizationStats(
        originalSize,
        optimizedSize,
        originalFormat,
        optimizedFormat
      );
      
      expect(stats.sizeReduction).toBe(350000);
      expect(stats.sizeReductionPercent).toBe(70);
      expect(stats.formatChanged).toBe(true);
      expect(stats.estimatedBandwidthSaving).toBe(350000000); // 350MB
    });

    it('should handle zero original size', () => {
      const stats = imageOptimization.getOptimizationStats(
        0,
        0,
        'jpeg',
        'jpeg'
      );
      
      expect(stats.sizeReductionPercent).toBe(0);
      expect(stats.formatChanged).toBe(false);
    });
  });

  describe('convenience exports', () => {
    it('should export convenience functions', () => {
      expect(typeof generateOptimizedUrl).toBe('function');
      expect(typeof generateSrcSet).toBe('function');
      expect(typeof createOptimizedImageAttrs).toBe('function');
    });

    it('should maintain context for convenience functions', () => {
      const url = 'https://example.com/image.jpg';
      const result = generateOptimizedUrl(url);
      
      expect(result).toContain('width=2048');
      expect(result).toContain('format=webp');
    });
  });
});

describe('Integration Tests', () => {
  it('should handle template gallery workflow', () => {
    const templateUrl = 'https://templates.example.com/preview.jpg';
    
    // Generate optimized URL for template gallery
    const optimizedUrl = generateOptimizedUrl(templateUrl, {
      width: 400,
      height: 300,
      quality: 85,
      format: 'webp'
    });
    
    expect(optimizedUrl).toContain('width=400');
    expect(optimizedUrl).toContain('height=300');
    expect(optimizedUrl).toContain('quality=85');  // Default quality is 80, so 85 should override
    expect(optimizedUrl).toContain('format=webp');
    
    // Generate responsive image attributes for card display
    const imageAttrs = createOptimizedImageAttrs(templateUrl, 'Template Preview', {
      width: 400,
      height: 300,
      class: 'template-preview',
      loading: 'lazy'
    });
    
    // The createOptimizedImageAttrs merges with default options, so quality will be 80 unless explicitly passed
    expect(imageAttrs.src).toContain('width=400');
    expect(imageAttrs.src).toContain('height=300');
    expect(imageAttrs.alt).toBe('Template Preview');
    expect(imageAttrs.class).toBe('template-preview');
    expect(imageAttrs.loading).toBe('lazy');
  });

  it('should provide fallback for invalid images', () => {
    const invalidUrl = 'not-an-image';
    const placeholder = imageOptimization.generatePlaceholder(300, 200, '#e5e7eb');
    
    expect(placeholder).toContain('data:image/svg+xml;base64,');
    expect(placeholder).not.toBe(invalidUrl);
  });
});