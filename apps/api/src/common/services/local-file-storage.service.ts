import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface LocalFileUploadOptions {
  directory: string;
  filename?: string;
  allowedExtensions?: string[];
}

@Injectable()
export class LocalFileStorageService {
  /**
   * Upload a file to local storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: LocalFileUploadOptions
  ): Promise<{ filename: string; path: string }> {
    // Create directory if it doesn't exist
    if (!fs.existsSync(options.directory)) {
      fs.mkdirSync(options.directory, { recursive: true });
    }

    // Validate file extension if specified
    if (options.allowedExtensions && options.filename) {
      const fileExtension = path.extname(options.filename).toLowerCase();
      if (!options.allowedExtensions.includes(fileExtension)) {
        throw new Error(
          `File extension ${fileExtension} is not allowed. Allowed: ${options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Generate unique filename if not provided
    const finalFilename = options.filename || `${uuidv4()}${path.extname(options.filename || '')}`;
    const filePath = path.join(options.directory, finalFilename);

    // Write file to the specified path
    fs.writeFileSync(filePath, fileBuffer);

    return {
      filename: finalFilename,
      path: filePath,
    };
  }

  /**
   * Get file from local storage
   */
  async getFile(filePath: string): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(filePath);
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.ctime,
    };
  }
}