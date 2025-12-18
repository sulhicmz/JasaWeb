/**
 * Dynamic Storage Configuration Service
 *
 * Provides flexible, secure storage adapter management with runtime configuration
 * switching and comprehensive validation for different storage providers.
 */

import { JasaWebConfig, unifiedConfig } from './unified-config.service';

export type StorageType = 'local' | 's3' | 'minio' | 'gcs' | 'azure';

export interface StorageConfig {
  type: StorageType;
  name: string;
  displayName: string;
  description: string;
  isAvailable: boolean;
  priority: number;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  validation: StorageValidation;
}

export interface StorageValidation {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  bucketRequired?: boolean;
  regionRequired?: boolean;
  encryptionRequired?: boolean;
  customValidation?: (config: Partial<JasaWebConfig>) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StorageAdapter {
  upload: (
    data: Buffer,
    options: StorageUploadOptions
  ) => Promise<StorageUploadResult>;
  download: (key: string, options: StorageDownloadOptions) => Promise<Buffer>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  getSignedUrl?: (key: string, expiresIn: number) => Promise<string>;
  list?: (prefix: string) => Promise<StorageListItem[]>;
}

export interface StorageUploadOptions {
  bucket?: string;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
  encryption?: boolean;
}

export interface StorageUploadResult {
  key: string;
  url?: string;
  etag?: string;
  size: number;
  bucket?: string;
}

export interface StorageDownloadOptions {
  bucket?: string;
  range?: { start: number; end: number };
}

export interface StorageListItem {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

/**
 * Storage Configuration Registry
 *
 * Manages available storage configurations with validation and priority
 */
export class StorageConfigRegistry {
  private static instance: StorageConfigRegistry;
  private configurations: Map<StorageType, StorageConfig> = new Map();
  private currentType: StorageType = 'local';

  private constructor() {
    this.initializeConfigurations();
    this.determineOptimalStorage();
  }

  public static getInstance(): StorageConfigRegistry {
    if (!StorageConfigRegistry.instance) {
      StorageConfigRegistry.instance = new StorageConfigRegistry();
    }
    return StorageConfigRegistry.instance;
  }

  /**
   * Initialize all storage configurations
   */
  private initializeConfigurations(): void {
    const config = unifiedConfig.getConfig();

    // Local Storage Configuration
    this.configurations.set('local', {
      type: 'local',
      name: 'local',
      displayName: 'Local File System',
      description: 'Store files on the local file system',
      isAvailable: true, // Always available as fallback
      priority: 1,
      requiredEnvVars: [],
      optionalEnvVars: ['LOCAL_STORAGE_PATH'],
      validation: {
        maxFileSize: config.fileUpload?.MAX_FILE_SIZE || 10 * 1024 * 1024,
        allowedMimeTypes: this.parseAllowedTypes(
          config.fileUpload?.ALLOWED_FILE_TYPES
        ),
        bucketRequired: false,
        regionRequired: false,
        encryptionRequired: false,
      },
    });

    // S3 Storage Configuration
    const s3Config = {
      type: 's3' as StorageType,
      name: 's3',
      displayName: 'Amazon S3',
      description: 'Store files in Amazon S3 cloud storage',
      isAvailable: this.validateS3Config(config),
      priority: 3,
      requiredEnvVars: [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET',
      ],
      optionalEnvVars: ['AWS_REGION', 'S3_REGION'],
      validation: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB for S3
        allowedMimeTypes: this.parseAllowedTypes(
          config.fileUpload?.ALLOWED_FILE_TYPES
        ),
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: true,
      },
    };

    this.configurations.set('s3', s3Config);

    // MinIO Configuration (S3-compatible)
    const minioConfig = {
      type: 'minio' as StorageType,
      name: 'minio',
      displayName: 'MinIO',
      description: 'Store files in MinIO S3-compatible storage',
      isAvailable: this.validateMinioConfig(config),
      priority: 2,
      requiredEnvVars: ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'],
      optionalEnvVars: ['MINIO_ENDPOINT', 'MINIO_REGION'],
      validation: {
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB for MinIO default
        allowedMimeTypes: this.parseAllowedTypes(
          config.fileUpload?.ALLOWED_FILE_TYPES
        ),
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: false,
      },
    };

    this.configurations.set('minio', minioConfig);

    // GCS Configuration (Future implementation)
    this.configurations.set('gcs', {
      type: 'gcs',
      name: 'gcs',
      displayName: 'Google Cloud Storage',
      description: 'Store files in Google Cloud Storage',
      isAvailable: false, // Not implemented yet
      priority: 4,
      requiredEnvVars: [
        'GCS_PROJECT_ID',
        'GCS_BUCKET',
        'GOOGLE_APPLICATION_CREDENTIALS',
      ],
      optionalEnvVars: ['GCS_REGION'],
      validation: {
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: true,
      },
    });

    // Azure Configuration (Future implementation)
    this.configurations.set('azure', {
      type: 'azure',
      name: 'azure',
      displayName: 'Azure Blob Storage',
      description: 'Store files in Azure Blob Storage',
      isAvailable: false, // Not implemented yet
      priority: 5,
      requiredEnvVars: ['AZURE_STORAGE_CONNECTION_STRING', 'AZURE_CONTAINER'],
      optionalEnvVars: ['AZURE_REGION'],
      validation: {
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: true,
      },
    });
  }

  /**
   * Determine optimal storage type based on availability and priority
   */
  private determineOptimalStorage(): void {
    const config = unifiedConfig.getConfig();
    const requestedType = config.storage?.STORAGE_TYPE as StorageType;

    if (requestedType && this.configurations.has(requestedType)) {
      const config = this.configurations.get(requestedType)!;
      if (config.isAvailable) {
        this.currentType = requestedType;
        return;
      }
    }

    // Fallback to highest priority available storage
    const availableConfigs = Array.from(this.configurations.values())
      .filter((c) => c.isAvailable)
      .sort((a, b) => b.priority - a.priority);

    if (availableConfigs.length > 0) {
      this.currentType = availableConfigs[0]!.type;
    }
  }

  /**
   * Validate S3 configuration
   */
  private validateS3Config(config: JasaWebConfig): boolean {
    const { storage } = config;
    return !!(
      storage?.AWS_ACCESS_KEY_ID &&
      storage?.AWS_SECRET_ACCESS_KEY &&
      storage?.S3_BUCKET
    );
  }

  /**
   * Validate MinIO configuration
   */
  private validateMinioConfig(config: JasaWebConfig): boolean {
    const { storage } = config;
    return !!(
      storage?.MINIO_ACCESS_KEY &&
      storage?.MINIO_SECRET_KEY &&
      storage?.MINIO_BUCKET
    );
  }

  /**
   * Parse allowed file types from comma-separated string
   */
  private parseAllowedTypes(typesString?: string): string[] {
    if (!typesString) return [];
    return typesString
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  /**
   * Get current storage configuration
   */
  public getCurrentStorageType(): StorageType {
    return this.currentType;
  }

  /**
   * Get configuration for specific storage type
   */
  public getStorageConfig(type: StorageType): StorageConfig | undefined {
    return this.configurations.get(type);
  }

  /**
   * Get current storage configuration
   */
  public getCurrentStorageConfig(): StorageConfig | undefined {
    return this.configurations.get(this.currentType);
  }

  /**
   * Get all available storage configurations
   */
  public getAvailableStorageConfigs(): StorageConfig[] {
    return Array.from(this.configurations.values())
      .filter((config) => config.isAvailable)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Switch storage type (with validation)
   */
  public switchStorageType(type: StorageType): ValidationResult {
    const config = this.configurations.get(type);

    if (!config) {
      return {
        isValid: false,
        errors: [`Storage type '${type}' is not supported`],
        warnings: [],
      };
    }

    if (!config.isAvailable) {
      return {
        isValid: false,
        errors: [
          `Storage type '${type}' is not available`,
          ...this.getMissingEnvVars(type),
        ],
        warnings: [],
      };
    }

    this.currentType = type;

    return {
      isValid: true,
      errors: [],
      warnings:
        config.type === 'local'
          ? ['Using local storage - ensure proper backup strategy']
          : [],
    };
  }

  /**
   * Get missing environment variables for storage type
   */
  private getMissingEnvVars(type: StorageType): string[] {
    const config = this.configurations.get(type);
    if (!config) return [];

    const configData = unifiedConfig.getConfig();
    const missing: string[] = [];

    for (const envVar of config.requiredEnvVars) {
      if (!this.getEnvValue(configData, envVar)) {
        missing.push(envVar);
      }
    }

    return missing;
  }

  /**
   * Get environment value safely
   */
  private getEnvValue(config: JasaWebConfig, key: string): string {
    // Map storage environment variables to config paths
    const envToConfigPath: Record<string, string> = {
      AWS_ACCESS_KEY_ID: 'storage.AWS_ACCESS_KEY_ID',
      AWS_SECRET_ACCESS_KEY: 'storage.AWS_SECRET_ACCESS_KEY',
      S3_BUCKET: 'storage.S3_BUCKET',
      AWS_REGION: 'storage.AWS_REGION',
      S3_REGION: 'storage.S3_REGION',
      MINIO_ACCESS_KEY: 'storage.MINIO_ACCESS_KEY',
      MINIO_SECRET_KEY: 'storage.MINIO_SECRET_KEY',
      MINIO_BUCKET: 'storage.MINIO_BUCKET',
      MINIO_ENDPOINT: 'storage.MINIO_ENDPOINT',
      MINIO_REGION: 'storage.S3_REGION', // Reuse S3 region
      LOCAL_STORAGE_PATH: 'base.SITE_URL',
      GCS_PROJECT_ID: 'storage.AWS_REGION', // Placeholder
      GCS_BUCKET: 'storage.S3_BUCKET', // Placeholder
      GOOGLE_APPLICATION_CREDENTIALS: 'storage.AWS_ACCESS_KEY_ID', // Placeholder
      AZURE_STORAGE_CONNECTION_STRING: 'storage.AWS_SECRET_ACCESS_KEY', // Placeholder
      AZURE_CONTAINER: 'storage.S3_BUCKET', // Placeholder
    };

    const path = envToConfigPath[key];
    if (!path) return '';

    try {
      const keys = path.split('.');
      let value: any = config;

      for (const key of keys) {
        value = value?.[key];
      }

      return value || '';
    } catch {
      return '';
    }
  }

  /**
   * Validate current configuration
   */
  public validateCurrentStorage(): ValidationResult {
    const config = this.getCurrentStorageConfig();
    if (!config) {
      return {
        isValid: false,
        errors: ['No storage configuration available'],
        warnings: ['Local storage will be used as fallback'],
      };
    }

    const result: ValidationResult = {
      isValid: config.isAvailable,
      errors: [],
      warnings: [],
    };

    // Check custom validation
    if (config.validation.customValidation) {
      const customResult = config.validation.customValidation(
        unifiedConfig.getConfig()
      );
      result.errors.push(...customResult.errors);
      result.warnings.push(...customResult.warnings);
    }

    return result;
  }

  /**
   * Get storage type summary for monitoring
   */
  public getStorageSummary(): Record<string, any> {
    const currentConfig = this.getCurrentStorageConfig();
    const availableConfigs = this.getAvailableStorageConfigs();

    return {
      current: {
        type: this.currentType,
        name: currentConfig?.displayName || 'Unknown',
        available: currentConfig?.isAvailable || false,
      },
      available: availableConfigs.map((config) => ({
        type: config.type,
        name: config.displayName,
        priority: config.priority,
      })),
      total: this.configurations.size,
      validation: this.validateCurrentStorage(),
    };
  }

  /**
   * Auto-switch to best available storage
   */
  public autoSelectBestStorage(): {
    previousType: StorageType;
    newType: StorageType;
    reason: string;
  } {
    const previousType = this.currentType;
    const previousConfig = this.configurations.get(previousType);

    // Only switch if current is not available
    if (previousConfig?.isAvailable) {
      return {
        previousType,
        newType: previousType,
        reason: 'Current storage is optimal',
      };
    }

    this.determineOptimalStorage();
    const newConfig = this.configurations.get(this.currentType);

    return {
      previousType,
      newType: this.currentType,
      reason: previousConfig?.isAvailable
        ? `Previous storage '${previousType}' became unavailable, switched to '${this.currentType}'`
        : `Selected best available storage: '${newConfig?.displayName}'`,
    };
  }

  /**
   * Create storage adapter instance
   */
  public createStorageAdapter(): StorageAdapter | null {
    const config = this.getCurrentStorageConfig();

    if (!config || !config.isAvailable) {
      return null;
    }

    // This would be implemented to return appropriate adapter
    // For now, return a placeholder
    return {
      upload: async () => ({ key: '', size: 0 }),
      download: async () => Buffer.from(''),
      delete: async () => {},
      exists: async () => false,
    };
  }
}

// Export singleton instance
export const storageConfigRegistry = StorageConfigRegistry.getInstance();

// Types are exported from index.ts to avoid conflicts
