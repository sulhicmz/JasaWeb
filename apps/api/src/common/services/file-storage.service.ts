import { Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
=======
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
>>>>>>> origin/main

export interface FileUploadOptions {
  bucket: string;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileDownloadOptions {
  bucket: string;
  key: string;
  expiresIn?: number; // Expiration time in seconds for signed URLs
}

@Injectable()
export class FileStorageService {
  private s3Client: S3Client;

  constructor() {
    // Initialize S3 client with environment variables
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // For S3-compatible services like MinIO
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      // For MinIO or other S3-compatible services, force path style
      forcePathStyle: !!process.env.S3_ENDPOINT,
    });
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(fileBuffer: Buffer, options: FileUploadOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      Body: fileBuffer,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    await this.s3Client.send(command);
    
    // Return the S3 key as the file identifier
    return options.key;
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async generateDownloadUrl(options: FileDownloadOptions): Promise<string> {
<<<<<<< HEAD
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    const expiresIn = options.expiresIn || 3600; // Default to 1 hour
    return await getSignedUrl(this.s3Client, command, { expiresIn });
=======
    const baseEndpoint = process.env.S3_ENDPOINT
      ? process.env.S3_ENDPOINT.replace(/\/$/, '')
      : `https://${options.bucket}.s3.amazonaws.com`;

    return `${baseEndpoint}/${options.key}`;
>>>>>>> origin/main
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get file information (metadata, size, etc.)
   */
  async getFileMetadata(bucket: string, key: string) {
    try {
      // Note: AWS SDK v3 doesn't have a direct headObject equivalent
      // We'll use GetObjectCommand but only fetch metadata
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      
<<<<<<< HEAD
      const response = await this.s3Client.send(command);
      
=======
      const response = (await this.s3Client.send(command)) as any;

>>>>>>> origin/main
      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        eTag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
}