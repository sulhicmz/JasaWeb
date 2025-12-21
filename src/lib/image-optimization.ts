/**
 * Image Optimization Service
 * Optimizes template gallery images using Cloudflare Workers
 * Provides on-the-fly image resizing, format conversion, and quality optimization
 */

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

interface OptimizedImageResult {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  optimized: boolean;
}

class ImageOptimizationService {
  private readonly defaultOptions: Partial<ImageOptions> = {
    quality: 80,
    format: 'webp',
    fit: 'cover',
    gravity: 'center'
  };

  private readonly supportedFormats = ['webp', 'avif', 'jpeg', 'png'];
  private readonly maxDimension = 2048;

  /**
   * Generate optimized image URL using Cloudflare Image Resizing
   * Enhanced with progressive loading and modern format detection
   */
  public generateOptimizedUrl(
    originalUrl: string,
    options: ImageOptions = {}
  ): string {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Validate dimensions
      const width = Math.min(mergedOptions.width || this.maxDimension, this.maxDimension);
      const height = Math.min(mergedOptions.height || this.maxDimension, this.maxDimension);
      
      // Create URL with Cloudflare Image Resizing parameters
      const url = new URL(originalUrl);
      
      // Add Cloudflare Image Resizing parameters
      url.searchParams.set('width', width.toString());
      url.searchParams.set('height', height.toString());
      url.searchParams.set('quality', mergedOptions.quality!.toString());
      url.searchParams.set('fit', mergedOptions.fit!);
      url.searchParams.set('gravity', mergedOptions.gravity!);
      
      // Auto-detect best format if not specified
      const format = mergedOptions.format || this.detectBestFormat();
      if (this.supportedFormats.includes(format)) {
        url.searchParams.set('format', format);
      }
      
      // Add performance optimizations
      url.searchParams.set('metadata', 'none'); // Strip metadata for smaller files
      url.searchParams.set('sharp', '10'); // Enhance sharpness for better perceived quality
      
      // Add cache-busting timestamp for development
      if (process.env.NODE_ENV === 'development') {
        url.searchParams.set('v', Date.now().toString());
      }
      
      return url.toString();
    } catch (error) {
      console.warn('Failed to generate optimized URL:', error);
      return originalUrl;
    }
  }

  /**
   * Detect best image format based on browser support and content type
   * This would ideally use Accept header in production
   */
  private detectBestFormat(): 'webp' | 'avif' | 'jpeg' {
    // For simplicity, prefer WebP as it has wide support and good compression
    // In production, this could use User-Agent or accept header detection
    return 'webp';
  }

  /**
   * Generate progressive image loading URLs
   * Creates a low-quality placeholder (LQIP) and high-quality version
   */
  public generateProgressiveUrls(
    originalUrl: string,
    width: number,
    height: number
  ): {
    lqip: string;
    high: string;
  } {
    const lqipUrl = this.generateOptimizedUrl(originalUrl, {
      width: width / 4, // 25% size for placeholder
      height: height / 4,
      quality: 20, // Low quality for fast loading
      format: 'webp'
    });

    const highQualityUrl = this.generateOptimizedUrl(originalUrl, {
      width,
      height,
      quality: 85,
      format: this.detectBestFormat()
    });

    return {
      lqip: lqipUrl,
      high: highQualityUrl
    };
  }

  /**
   * Generate srcset for different screen sizes
   */
  public generateSrcSet(
    originalUrl: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536],
    options: ImageOptions = {}
  ): string {
    try {
      const validation = this.validateImageUrl(originalUrl);
      if (!validation.valid) {
        return originalUrl;
      }

      const srcsetEntries = breakpoints.map(width => {
        const optimizedUrl = this.generateOptimizedUrl(originalUrl, {
          ...options,
          width
        });
        
        return `${optimizedUrl} ${width}w`;
      });
      
      return srcsetEntries.join(', ');
    } catch (error) {
      console.warn('Failed to generate srcset:', error);
      return originalUrl;
    }
  }

  /**
   * Generate sizes attribute for responsive images
   */
  public generateSizes(sizes: string[] = ['100vw']): string {
    return sizes.join(', ');
  }

  /**
   * Create optimized image HTML attributes
   */
  public createOptimizedImageAttrs(
    originalUrl: string,
    alt: string,
    options: ImageOptions & {
      width?: number;
      height?: number;
      loading?: 'lazy' | 'eager';
      decoding?: 'async' | 'sync' | 'auto';
      class?: string;
    } = {}
  ): {
    src: string;
    srcset?: string;
    sizes?: string;
    alt: string;
    width?: number;
    height?: number;
    loading: string;
    decoding: string;
    class?: string;
  } {
    const {
      width: originalWidth,
      height: originalHeight,
      loading = 'lazy',
      decoding = 'async',
      class: cssClass
    } = options;

    const optimizedUrl = this.generateOptimizedUrl(originalUrl, options);
    
    const attrs: any = {
      src: optimizedUrl,
      alt,
      loading,
      decoding: decoding as 'async' | 'sync' | 'auto'
    };

    // Add dimensions if provided
    if (originalWidth) attrs.width = originalWidth;
    if (originalHeight) attrs.height = originalHeight;
    if (cssClass) attrs.class = cssClass;

    // Add responsive attributes for larger images
    if (originalWidth && originalWidth > 320) {
      attrs.srcset = this.generateSrcSet(originalUrl, undefined, options);
      attrs.sizes = this.generateSizes();
    }

    return attrs;
  }

  /**
   * Validate image URL for optimization
   */
  public validateImageUrl(url: string): { valid: boolean; error?: string } {
    try {
      if (!url || typeof url !== 'string') {
        return { valid: false, error: 'Invalid URL format' };
      }

      const urlObj = new URL(url);
      
      // Check if it's an HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must be HTTP or HTTPS' };
      }

      // Check for common image file extensions
      const pathname = urlObj.pathname.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      
      if (!hasImageExtension) {
        return { valid: false, error: 'URL must point to an image file' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Get image info from URL (simulated - in production would use HEAD request)
   */
  public async getImageInfo(url: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  } | null> {
    try {
      // In a real implementation, this would make a HEAD request or use 
      // Cloudflare's image service to get metadata
      // For now, return estimated values based on common template image sizes
      
      const validation = this.validateImageUrl(url);
      if (!validation.valid) {
        return null;
      }

      // Estimate typical template preview dimensions
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      let format = 'jpeg';
      if (pathname.endsWith('.png')) format = 'png';
      else if (pathname.endsWith('.webp')) format = 'webp';
      else if (pathname.endsWith('.avif')) format = 'avif';

      // Typical template preview dimensions
      const width = 800;
      const height = 600;
      
      // Estimated file size (rough calculation based on format and dimensions)
      const estimatedSize = format === 'webp' ? 150000 : format === 'png' ? 300000 : 200000;

      return {
        width,
        height,
        size: estimatedSize,
        format
      };
    } catch (error) {
      console.warn('Failed to get image info:', error);
      return null;
    }
  }

  /**
   * Generate placeholder image (data URI)
   */
  public generatePlaceholder(
    width: number = 400,
    height: number = 300,
    color: string = '#e5e7eb'
  ): string {
    // Simple SVG placeholder
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>`;

    // Convert to base64 data URI
    const base64 = btoa(svg.replace(/[\s\t\n]/g, ''));
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Get optimization statistics for analytics
   */
  public getOptimizationStats(
    originalSize: number,
    optimizedSize: number,
    originalFormat: string,
    optimizedFormat: string
  ): {
    sizeReduction: number;
    sizeReductionPercent: number;
    formatChanged: boolean;
    estimatedBandwidthSaving: number;
  } {
    const sizeReduction = originalSize - optimizedSize;
    const sizeReductionPercent = originalSize > 0 ? (sizeReduction / originalSize) * 100 : 0;
    const formatChanged = originalFormat !== optimizedFormat;
    
    // Estimate bandwidth saving based on typical traffic pattern
    const estimatedViewsPerMonth = 1000; // Rough estimate
    const estimatedBandwidthSaving = sizeReduction * estimatedViewsPerMonth;

    return {
      sizeReduction,
      sizeReductionPercent,
      formatChanged,
      estimatedBandwidthSaving
    };
  }
}

// Export singleton instance
export const imageOptimization = new ImageOptimizationService();

// Convenience functions
export const generateOptimizedUrl = imageOptimization.generateOptimizedUrl.bind(imageOptimization);
export const generateSrcSet = imageOptimization.generateSrcSet.bind(imageOptimization);
export const createOptimizedImageAttrs = imageOptimization.createOptimizedImageAttrs.bind(imageOptimization);

export type { ImageOptions, OptimizedImageResult };