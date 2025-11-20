import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

export interface EncryptedData {
  data: string;
  iv: string;
  tag?: string;
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
}

@Injectable()
export class DataEncryptionService {
  private readonly logger = new Logger(DataEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits
  private encryptionKey: Buffer;

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize encryption key from environment or generate one
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      const keyString = process.env.ENCRYPTION_KEY;

      if (keyString) {
        // Use provided key from environment
        this.encryptionKey = Buffer.from(keyString, 'hex');
        if (this.encryptionKey.length !== this.keyLength) {
          throw new Error('Invalid encryption key length');
        }
      } else {
        // Generate a new key (in production, this should be stored securely)
        this.encryptionKey = randomBytes(this.keyLength);
        this.logger.warn(
          'Generated new encryption key. In production, set ENCRYPTION_KEY environment variable.'
        );
        this.logger.log(
          `Generated encryption key (hex): ${this.encryptionKey.toString('hex')}`
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize encryption key', error.stack);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(plaintext: string): Promise<EncryptionResult> {
    try {
      const iv = randomBytes(this.ivLength);
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Encryption failed', error.stack);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = encryptedData.tag
        ? Buffer.from(encryptedData.tag, 'hex')
        : undefined;

      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);

      if (tag) {
        decipher.setAuthTag(tag);
      }

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error.stack);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Encrypt field in database format
   */
  async encryptField(data: string): Promise<string> {
    const result = await this.encrypt(data);
    return JSON.stringify(result);
  }

  /**
   * Decrypt field from database format
   */
  async decryptField(encryptedField: string): Promise<string> {
    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedField);
      return await this.decrypt(encryptedData);
    } catch (error) {
      this.logger.error('Field decryption failed', error.stack);
      throw new Error('Field decryption failed');
    }
  }

  /**
   * Encrypt PII data with additional metadata
   */
  async encryptPii(
    data: string,
    dataType: string,
    userId?: string
  ): Promise<{
    encrypted: string;
    metadata: {
      dataType: string;
      encryptedAt: string;
      userId?: string;
    };
  }> {
    const result = await this.encrypt(data);

    return {
      encrypted: JSON.stringify(result),
      metadata: {
        dataType,
        encryptedAt: new Date().toISOString(),
        userId,
      },
    };
  }

  /**
   * Decrypt PII data with metadata validation
   */
  async decryptPii(encryptedData: {
    encrypted: string;
    metadata: {
      dataType: string;
      encryptedAt: string;
      userId?: string;
    };
  }): Promise<string> {
    try {
      const encrypted: EncryptedData = JSON.parse(encryptedData.encrypted);
      const decrypted = await this.decrypt(encrypted);

      // Log access to sensitive data
      this.logger.log(
        `PII data accessed: ${encryptedData.metadata.dataType} for user ${encryptedData.metadata.userId || 'unknown'}`
      );

      return decrypted;
    } catch (error) {
      this.logger.error('PII decryption failed', error.stack);
      throw new Error('PII data decryption failed');
    }
  }

  /**
   * Generate data hash for integrity verification
   */
  async generateHash(data: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 0);
    }

    return (
      data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars)
    );
  }

  /**
   * Check if data appears to be encrypted
   */
  isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      return (
        parsed.encrypted &&
        parsed.iv &&
        (parsed.tag || this.algorithm !== 'aes-256-gcm')
      );
    } catch {
      return false;
    }
  }

  /**
   * Rotate encryption key (for future implementation)
   */
  async rotateKey(): Promise<void> {
    this.logger.warn('Key rotation not yet implemented');
    // In production, this would:
    // 1. Generate new key
    // 2. Re-encrypt all sensitive data with new key
    // 3. Update ENCRYPTION_KEY environment variable
    // 4. Securely destroy old key
  }

  /**
   * Get encryption algorithm info
   */
  getAlgorithmInfo(): {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  } {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
    };
  }
}
