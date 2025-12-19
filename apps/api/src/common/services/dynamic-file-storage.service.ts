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
  JasaWebConfig,
} from '@jasaweb/config';
import type {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommandOutput,
  PutObjectCommandOutput,
  HeadObjectCommandOutput,
  ListObjectsV2CommandOutput,
  _Object,
} from '@aws-sdk/client-s3';
import type { getSignedUrl as GetSignedUrl } from '@aws-sdk/s3-request-presigner';

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

  async getSignedUrl(key: string, _expiresIn: number): Promise<string> {
    // Validate key to prevent injection
    if (!/^[a-zA-Z0-9-._/]+$/.test(key)) {
      throw new Error('Invalid key format');
    }
    throw new Error('Signed URLs not supported by this storage adapter');
  }

  async list(): Promise<{ key: string; size: number; lastModified: Date }[]> {
    throw new Error('List operation not supported by this storage adapter');
  }
}

interface S3StorageConfig {
  region?: string;
  bucket?: string;
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
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');

    // Define allowed base directories for security
    const allowedBases = ['./uploads', '/tmp/uploads'] as const;

    // Sanitize and validate path to prevent directory traversal
    const normalizedPath = path.normalize(this.uploadPath);
    const isAllowed = allowedBases.some((base) =>
      normalizedPath.startsWith(base)
    );

    if (!isAllowed) {
      throw new Error(
        'Invalid upload path detected - must be within allowed directories'
      );
    }

    // Additional security checks
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
      throw new Error('Potentially dangerous path detected');
    }

    // Validate the path is literal and safe
    if (!/^[a-zA-Z0-9-._/]+$/.test(normalizedPath)) {
      throw new Error('Invalid characters in upload path');
    }

    // Security: Use literal constant and secure filesystem operation wrapper
    const DEFAULT_UPLOAD_DIR = 'uploads' as const;
    const uploadDir = normalizedPath.endsWith(DEFAULT_UPLOAD_DIR)
      ? normalizedPath
      : path.join(normalizedPath, DEFAULT_UPLOAD_DIR);

    // Security: Create secure filesystem operation wrapper
    const secureFileExists = (filePath: string): boolean => {
      const ALLOWED_BASES = [process.cwd(), '/tmp'];
      const pathModule = require('path');
      const resolvedPath = pathModule.resolve(filePath);
      const isAllowed = ALLOWED_BASES.some((base) =>
        resolvedPath.startsWith(base)
      );
      // Secure file existence check with validated path
      try {
        // Path is validated through security checks above to prevent directory traversal
        return isAllowed && fs.existsSync(filePath);
      } catch (error) {
        this.logger.error('File existence check failed:', error);
        return false;
      }
    };

    const secureMkdir = (dirPath: string): void => {
      const ALLOWED_BASES = [process.cwd(), '/tmp'];
      const pathModule = require('path');
      const resolvedPath = pathModule.resolve(dirPath);
      const isAllowed = ALLOWED_BASES.some((base) =>
        resolvedPath.startsWith(base)
      );
      if (!isAllowed) {
        throw new Error('Path not allowed for directory creation');
      }
      // Secure directory creation with validated path
      try {
        // Path is validated through security checks above to prevent directory traversal
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o750 });
      } catch (error) {
        this.logger.error('Directory creation failed:', error);
        throw error;
      }
    };

    if (!secureFileExists(uploadDir)) {
      try {
        secureMkdir(uploadDir);
      } catch (error) {
        throw new Error(
          `Failed to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    this.uploadPath = normalizedPath;
  }

  async upload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');

    // Sanitize the key to prevent path traversal
    const sanitizedKey = options.key.replace(/[^a-zA-Z0-9\-_/.]/g, '');
    // Additional validation to prevent path traversal
    if (
      sanitizedKey.includes('..') ||
      sanitizedKey.includes('~') ||
      sanitizedKey.startsWith('/')
    ) {
      throw new Error('Invalid file key detected');
    }
    const filePath = path.join(this.uploadPath, sanitizedKey);
    const normalizedPath = path.normalize(filePath);

    // Ensure file stays within allowed directory
    if (!normalizedPath.startsWith(path.normalize(this.uploadPath))) {
      throw new Error('Path traversal attempt detected in file upload');
    }

    const dirPath = path.dirname(normalizedPath);

    // Ensure directory exists with validation
    const normalizedDirPath = path.normalize(dirPath);
    if (!normalizedDirPath.startsWith(path.normalize(this.uploadPath))) {
      throw new Error('Invalid directory path detected');
    }
    if (!/^[a-zA-Z0-9-._/]+$/.test(normalizedDirPath)) {
      throw new Error('Invalid characters in directory path');
    }
    // Secure directory creation with validated path
    try {
      // Path is validated through normalization and path checks above to prevent directory traversal
      await fs.mkdir(normalizedDirPath, { recursive: true, mode: 0o750 });
    } catch (error) {
      this.logger.error('Directory creation failed:', error);
      throw error;
    }

    // Write file with secure permissions
    try {
      // Path is validated through normalization and path checks above to prevent directory traversal
      await fs.writeFile(normalizedPath, data, { mode: 0o640 });
    } catch (error) {
      this.logger.error('File write failed:', error);
      throw error;
    }

    // Calculate file hash for integrity
    const hash = crypto.createHash('sha256');
    hash.update(data);
    const etag = hash.digest('hex');

    this.logger.log(`File uploaded locally: ${sanitizedKey}`);

    return {
      key: sanitizedKey,
      size: data.length,
      etag,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fs = require('fs').promises;
    const path = require('path');

    // Sanitize key to prevent path traversal
    const sanitizedKey = key.replace(/[^a-zA-Z0-9\-_/.]/g, '');
    // Additional validation to prevent path traversal
    if (
      sanitizedKey.includes('..') ||
      sanitizedKey.includes('~') ||
      sanitizedKey.startsWith('/')
    ) {
      throw new Error('Invalid file key detected');
    }
    const filePath = path.join(this.uploadPath, sanitizedKey);
    const normalizedPath = path.normalize(filePath);

    // Ensure file stays within allowed directory
    if (!normalizedPath.startsWith(path.normalize(this.uploadPath))) {
      throw new Error('Path traversal attempt detected in file download');
    }

    // Secure file read with validated path
    try {
      // Path is validated through normalization and path checks above to prevent directory traversal
      return await fs.readFile(normalizedPath);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        throw new Error(`File not found: ${sanitizedKey}`);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    // Sanitize key to prevent path traversal
    const sanitizedKey = key.replace(/[^a-zA-Z0-9\-_/.]/g, '');
    // Additional validation to prevent path traversal
    if (
      sanitizedKey.includes('..') ||
      sanitizedKey.includes('~') ||
      sanitizedKey.startsWith('/')
    ) {
      throw new Error('Invalid file key detected');
    }
    const filePath = path.join(this.uploadPath, sanitizedKey);
    const normalizedPath = path.normalize(filePath);

    // Ensure file stays within allowed directory
    if (!normalizedPath.startsWith(path.normalize(this.uploadPath))) {
      throw new Error('Path traversal attempt detected in file deletion');
    }

    // Secure file deletion with validated path
    try {
      // Path is validated through normalization and path checks above to prevent directory traversal
      await fs.unlink(normalizedPath);
      this.logger.log(`File deleted locally: ${sanitizedKey}`);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${sanitizedKey}`);
        return;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fs = require('fs').promises;
    const path = require('path');

    // Sanitize key to prevent path traversal
    const sanitizedKey = key.replace(/[^a-zA-Z0-9\-_/.]/g, '');
    // Additional validation to prevent path traversal
    if (
      sanitizedKey.includes('..') ||
      sanitizedKey.includes('~') ||
      sanitizedKey.startsWith('/')
    ) {
      return false; // Treat suspicious paths as non-existent
    }
    const filePath = path.join(this.uploadPath, sanitizedKey);
    const normalizedPath = path.normalize(filePath);

    // Ensure file stays within allowed directory
    if (!normalizedPath.startsWith(path.normalize(this.uploadPath))) {
      return false; // Treat suspicious paths as non-existent
    }

    try {
      await fs.access(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * S3 Storage Adapter Implementation
 */
class S3StorageAdapter extends BaseStorageAdapter {
  private region: string;
  private bucket: string;
  private accessKey?: string;
  private secretKey?: string;
  private endpoint?: string;
  private s3Client: S3Client | null = null; // AWS S3 Client
  private s3Presigner: { getSignedUrl: typeof GetSignedUrl } | null = null; // AWS S3 Request Presigner

  constructor(config: S3StorageConfig) {
    super();
    this.region = config.region || 'us-east-1';
    this.bucket = config.bucket || 'default-bucket';
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.endpoint = config.endpoint;
  }

  private async initializeClient(): Promise<void> {
    if (this.s3Client) return;

    try {
      // Dynamic imports with proper typing
      const s3Module = await import('@aws-sdk/client-s3');
      const presignerModule = await import('@aws-sdk/s3-request-presigner');

      const S3Client =
        s3Module.S3Client as typeof import('@aws-sdk/client-s3').S3Client;
      const getSignedUrl =
        presignerModule.getSignedUrl as typeof import('@aws-sdk/s3-request-presigner').getSignedUrl;

      // Create S3 client configuration
      const clientConfig: S3ClientConfig = {
        region: this.region,
      };

      // Add custom endpoint for MinIO or S3-compatible services
      if (this.endpoint) {
        clientConfig.endpoint = this.endpoint;
        clientConfig.forcePathStyle = true; // Required for MinIO
      }

      // Add credentials if available (otherwise uses default chain)
      if (this.accessKey && this.secretKey) {
        clientConfig.credentials = {
          accessKeyId: this.accessKey,
          secretAccessKey: this.secretKey,
        };
      }

      this.s3Client = new S3Client(clientConfig);

      // Initialize presigner
      this.s3Presigner = { getSignedUrl };

      this.logger.log(`S3 client initialized for bucket: ${this.bucket}`);
    } catch (error) {
      this.logger.error('Failed to initialize S3 client:', error);
      throw new Error(
        `S3 client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async upload(
    data: Buffer,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    await this.initializeClient();

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');

      // Validate key to prevent injection
      if (!/^[a-zA-Z0-9-._/]+$/.test(options.key)) {
        throw new Error('Invalid key format for S3 upload');
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: data,
        ContentType: options.contentType,
        Metadata: options.metadata || {},
      });

      const result = await this.s3Client.send(command);

      this.logger.log(
        `File uploaded to S3: ${options.key} (${data.length} bytes)`
      );

      return {
        key: options.key,
        size: data.length,
        bucket: this.bucket,
        etag: result.ETag?.replace(/"/g, ''), // Remove quotes from ETag
        url: this.endpoint
          ? `${this.endpoint}/${this.bucket}/${options.key}`
          : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${options.key}`,
      };
    } catch (error) {
      this.logger.error(`S3 upload failed for ${options.key}:`, error);
      throw new Error(
        `S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async download(key: string): Promise<Buffer> {
    await this.initializeClient();

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');

      // Validate key to prevent injection
      if (!/^[a-zA-Z0-9-._/]+$/.test(key)) {
        throw new Error('Invalid key format for S3 download');
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = result.Body as AsyncIterable<Uint8Array>;

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);

      this.logger.log(
        `File downloaded from S3: ${key} (${buffer.length} bytes)`
      );
      return buffer;
    } catch (error: unknown) {
      const awsError = error as { name?: string };
      if (awsError.name === 'NoSuchKey') {
        throw new Error(`File not found: ${key}`);
      }
      this.logger.error(`S3 download failed for ${key}:`, error);
      throw new Error(
        `S3 download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(key: string): Promise<void> {
    await this.initializeClient();

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      // Validate key to prevent injection
      if (!/^[a-zA-Z0-9-._/]+$/.test(key)) {
        throw new Error('Invalid key format for S3 delete');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`S3 delete failed for ${key}:`, error);
      throw new Error(
        `S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.initializeClient();

    if (!this.s3Client) {
      return false;
    }

    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');

      // Validate key to prevent injection
      if (!/^[a-zA-Z0-9-._/]+$/.test(key)) {
        return false; // Treat suspicious keys as non-existent
      }

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      const awsError = error as { name?: string };
      if (awsError.name === 'NotFound' || awsError.name === 'NoSuchKey') {
        return false;
      }
      this.logger.error(`S3 exists check failed for ${key}:`, error);
      return false;
    }
  }

  override async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    await this.initializeClient();

    if (!this.s3Client || !this.s3Presigner) {
      throw new Error('S3 client or presigner not initialized');
    }

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');

      // Validate key to prevent injection
      if (!/^[a-zA-Z0-9-._/]+$/.test(key)) {
        throw new Error('Invalid key format for S3 signed URL');
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await this.s3Presigner.getSignedUrl(
        this.s3Client,
        command,
        { expiresIn }
      );

      this.logger.log(
        `Generated signed URL for S3: ${key} (expires in ${expiresIn}s)`
      );
      return signedUrl;
    } catch (error) {
      this.logger.error(`S3 signed URL generation failed for ${key}:`, error);
      throw new Error(
        `S3 signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  override async list(): Promise<
    { key: string; size: number; lastModified: Date }[]
  > {
    await this.initializeClient();

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
      });

      const result = await this.s3Client.send(command);

      const objects =
        result.Contents?.map((obj: _Object) => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
        })) || [];

      this.logger.log(
        `Listed ${objects.length} objects from S3 bucket: ${this.bucket}`
      );
      return objects;
    } catch (error) {
      this.logger.error(
        `S3 list operation failed for bucket ${this.bucket}:`,
        error
      );
      throw new Error(
        `S3 list operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
        const s3Config: S3StorageConfig = {
          region: this.configService.get('AWS_REGION') || 'us-east-1',
          bucket: this.configService.get('S3_BUCKET'),
          accessKey: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        };
        return new S3StorageAdapter(s3Config);
      }

      case 'minio': {
        const minioConfig: S3StorageConfig = {
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
      const config: JasaWebConfig =
        (this.configService.get('PRODUCTION_CONFIG') as JasaWebConfig) ||
        ({} as JasaWebConfig);
      const customResult = validation.customValidation(config);

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
