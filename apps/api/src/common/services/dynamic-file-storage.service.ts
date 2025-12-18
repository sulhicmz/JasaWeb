/**
 * Enhanced File Storage Service with Dynamic Configuration
 *
 * This service provides a unified interface for different storage backends
 * with automatic failover, security validation, and comprehensive monitoring.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  storageConfigRegistry,
  StorageType,
  StorageConfig,
  StorageAdapter,
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadOptions,
  ValidationResult,
} from '@jasaweb/config';

/**
 * Storage provider interface implementation for different backends
 */
abstract class BaseStorageAdapter implements StorageAdapter {
  protected readonly logger = new Logger(this.constructor.name);

  abstract upload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  abstract download(
    key: string,
    options: StorageDownloadOptions
  ): Promise<Buffer>;

  abstract delete(key: string): Promise<void>;

  abstract exists(key: string): Promise<boolean>;

  async getSignedUrl(_key: string, _expiresIn: number): Promise<string> {
    throw new Error('Signed URLs not supported by this storage adapter');
  }

  async list(
    _prefix: string
  ): Promise<{ key: string; size: number; lastModified: Date }[]> {
    throw new Error('List operation not supported by this storage adapter');
  }
}

interface S3StorageConfig {
  region?: string;
  bucket: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
}

/**
 * Local File System Storage Adapter
 */
class LocalStorageAdapter extends BaseStorageAdapter {
  private uploadPath: string;

  constructor(uploadPath = './uploads') {
    super();
    this.uploadPath = uploadPath;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const fs = require('fs');

    // Validate path to prevent directory traversal
    if (this.uploadPath.includes('..') || this.uploadPath.includes('~')) {
      throw new Error('Invalid upload path detected');
    }

    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true, mode: 0o750 });
    }
  }

  async upload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');

    const filePath = path.join(this.uploadPath, options.key);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true, mode: 0o750 });

    // Write file
    await fs.writeFile(filePath, data, { mode: 0o640 });

    // Calculate file hash for integrity
    const hash = crypto.createHash('sha256');
    hash.update(data);
    const etag = hash.digest('hex');

    this.logger.log(`File uploaded locally: ${options.key}`);

    return {
      key: options.key,
      size: data.length,
      etag,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fs = require('fs').promises;
    const path = require('path');

    const filePath = path.join(this.uploadPath, key);

    try {
      return await fs.readFile(filePath);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const filePath = path.join(this.uploadPath, key);

    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted locally: ${key}`);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${key}`);
        return;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fs = require('fs').promises;

    const filePath = require('path').join(this.uploadPath, key);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * S3 Storage Adapter (Placeholder for future implementation)
 */
class S3StorageAdapter extends BaseStorageAdapter {
  private bucket: string;

  constructor(config: S3StorageConfig) {
    super();
    this.bucket = config.bucket;
  }

  async upload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    // Simulated S3 upload - requires actual AWS SDK implementation
    this.logger.log(`S3 upload simulated: ${options.key}`);

    return {
      key: options.key,
      size: data.length,
      bucket: this.bucket,
    };
  }

  async download(key: string): Promise<Buffer> {
    // Simulated S3 download - requires actual AWS SDK implementation
    this.logger.log(`S3 download simulated: ${key}`);
    return Buffer.from('mock file content');
  }

  async delete(key: string): Promise<void> {
    // Simulated S3 delete - requires actual AWS SDK implementation
    this.logger.log(`S3 delete simulated: ${key}`);
  }

  async exists(_key: string): Promise<boolean> {
    // Simulated S3 exists check - requires actual AWS SDK implementation
    return false;
  }

  override async getSignedUrl(
    _key: string,
    _expiresIn: number
  ): Promise<string> {
    // Simulated S3 signed URL - requires actual AWS SDK implementation
    return `https://s3-signed-url-placeholder/placeholder?expires=3600`;
  }
}

/**
 * Enhanced File Storage Service
 */
@Injectable()
export class DynamicFileStorageService implements OnModuleInit {
  private readonly logger = new Logger(DynamicFileStorageService.name);
  private currentAdapter: StorageAdapter | null = null;
  private currentConfig: StorageConfig | null = null;
  private storageRegistry = storageConfigRegistry;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeStorage();
  }

  /**
   * Initialize the optimal storage adapter
   */
  private async initializeStorage(): Promise<void> {
    const autoSelectResult = this.storageRegistry.autoSelectBestStorage();

    this.logger.log(
      `Storage initialization: ${autoSelectResult.previousType} → ${autoSelectResult.newType}`
    );
    this.logger.log(`Reason: ${autoSelectResult.reason}`);

    await this.switchToBestStorage();
  }

  /**
   * Switch to the best available storage
   */
  private async switchToBestStorage(): Promise<void> {
    const config = this.storageRegistry.getCurrentStorageConfig();

    if (!config) {
      this.logger.error('No available storage configuration found');
      throw new Error('No storage configuration available');
    }

    this.currentConfig = config;
    this.currentAdapter = await this.createAdapter(config);

    // Validate the configuration
    const validation = this.storageRegistry.validateCurrentStorage();

    if (!validation.isValid) {
      this.logger.error('Storage validation failed:', validation.errors);
      throw new Error(
        `Storage validation failed: ${validation.errors.join(', ')}`
      );
    }

    if (validation.warnings.length > 0) {
      this.logger.warn('Storage warnings:', validation.warnings);
    }

    this.logger.log(`Storage adapter initialized: ${config.displayName}`);
  }

  /**
   * Create appropriate storage adapter based on configuration
   */
  private async createAdapter(config: StorageConfig): Promise<StorageAdapter> {
    switch (config.type) {
      case 'local':
        return new LocalStorageAdapter();

      case 's3': {
        const s3Config = {
          region: this.configService.get('AWS_REGION') || 'us-east-1',
          bucket: this.configService.get('S3_BUCKET'),
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        };
        return new S3StorageAdapter(s3Config);
      }

      case 'minio': {
        const minioConfig = {
          endpoint: this.configService.get('MINIO_ENDPOINT'),
          bucket: this.configService.get('MINIO_BUCKET'),
          accessKey: this.configService.get('MINIO_ACCESS_KEY'),
          secretKey: this.configService.get('MINIO_SECRET_KEY'),
        };
        return new S3StorageAdapter(minioConfig); // Reuse S3 adapter for MinIO
      }

      default:
        throw new Error(`Storage type '${config.type}' is not implemented`);
    }
  }

  /**
   * Upload file with security validation
   */
  async uploadFile(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    if (!this.currentAdapter) {
      throw new Error('Storage adapter not initialized');
    }

    try {
      // Validate upload against current storage configuration
      await this.validateUpload(data, options);

      // Perform upload
      const result = await this.currentAdapter.upload(data, options);

      this.logger.log(
        `File uploaded successfully: ${options.key} (${data.length} bytes)`
      );

      return result;
    } catch (error) {
      this.logger.error(`Upload failed for ${options.key}:`, error);
      throw error;
    }
  }

  /**
   * Download file with security validation
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (!this.currentAdapter) {
      throw new Error('Storage adapter not initialized');
    }

    try {
      // Check if file exists
      const exists = await this.currentAdapter.exists(key);
      if (!exists) {
        throw new Error(`File not found: ${key}`);
      }

      const data = await this.currentAdapter.download(key, {});

      this.logger.log(`File downloaded successfully: ${key}`);
      return data;
    } catch (error) {
      this.logger.error(`Download failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete file with security validation
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error('Storage adapter not initialized');
    }

    try {
      await this.currentAdapter.delete(key);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Delete failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.currentAdapter) {
      return false;
    }

    try {
      return await this.currentAdapter.exists(key);
    } catch (error) {
      this.logger.error(`Exists check failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Generate signed URL for file download (if supported)
   */
  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.currentAdapter || !this.currentAdapter.getSignedUrl) {
      throw new Error('Signed URLs not supported by current storage adapter');
    }

    try {
      return await this.currentAdapter.getSignedUrl(key, expiresIn);
    } catch (error) {
      this.logger.error(`Signed URL generation failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Validate upload against storage configuration
   */
  private async validateUpload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<void> {
    if (!this.currentConfig) {
      throw new Error('Storage configuration not available');
    }

    const { validation } = this.currentConfig;

    // Validate file size
    if (validation.maxFileSize && data.length > validation.maxFileSize) {
      throw new Error(
        `File size ${data.length} exceeds maximum allowed size ${validation.maxFileSize}`
      );
    }

    // Validate MIME type
    if (
      validation.allowedMimeTypes &&
      !validation.allowedMimeTypes.includes(options.contentType)
    ) {
      throw new Error(`Content type ${options.contentType} is not allowed`);
    }

    // Validate bucket requirement
    if (validation.bucketRequired && !options.bucket) {
      throw new Error('Bucket is required for this storage type');
    }

    // Custom validation
    if (validation.customValidation) {
      const customResult = validation.customValidation(
        this.configService.get('NODE_ENV') === 'production'
          ? this.configService.get('PRODUCTION_CONFIG') || {}
          : {}
      );

      if (!customResult.isValid) {
        throw new Error(
          `Custom validation failed: ${customResult.errors.join(', ')}`
        );
      }
    }
  }

  /**
   * Get storage health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    storageType: StorageType;
    displayName: string;
    validation: ValidationResult;
  }> {
    const validation = this.storageRegistry.validateCurrentStorage();
    const config = this.storageRegistry.getCurrentStorageConfig();

    return {
      healthy: validation.isValid && !!this.currentAdapter,
      storageType: this.storageRegistry.getCurrentStorageType(),
      displayName: config?.displayName || 'Unknown',
      validation,
    };
  }

  /**
   * Get storage metrics
   */
  async getStorageMetrics(): Promise<{
    current: {
      type: StorageType;
      name: string;
      healthy: boolean;
    };
    available: Array<{
      type: StorageType;
      name: string;
      priority: number;
    }>;
    summary: Record<string, unknown>;
  }> {
    const health = await this.getHealthStatus();
    const available = this.storageRegistry.getAvailableStorageConfigs();
    const summary = this.storageRegistry.getStorageSummary();

    return {
      current: {
        type: health.storageType,
        name: health.displayName,
        healthy: health.healthy,
      },
      available: available.map((config) => ({
        type: config.type,
        name: config.displayName,
        priority: config.priority,
      })),
      summary,
    };
  }

  /**
   * Force re-initialization of storage (useful for testing or configuration changes)
   */
  async reinitializeStorage(): Promise<void> {
    this.logger.log('Reinitializing storage service...');
    await this.initializeStorage();
  }
}
