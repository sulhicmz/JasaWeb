import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Sanitize file paths to prevent directory traversal
function sanitizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\.\./g, '');
}

// Validate directory path
function isValidDirectoryPath(dirPath: string): boolean {
  const sanitized = sanitizePath(dirPath);
  return (
    sanitized === dirPath &&
    !sanitized.includes('..') &&
    path.isAbsolute(sanitized)
  );
}

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
    // Validate and create directory if it doesn't exist
    if (!isValidDirectoryPath(options.directory)) {
      throw new Error('Invalid directory path');
    }
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
    const baseFilename = options.filename || 'upload';
    const fileExtension = path.extname(baseFilename);
    const finalFilename = options.filename || `${uuidv4()}${fileExtension}`;

    // Sanitize filename and validate final path
    const sanitizedFilename = sanitizePath(finalFilename);
    const filePath = path.join(options.directory, sanitizedFilename);

    // Validate final file path
    if (!filePath.startsWith(options.directory)) {
      throw new Error('Invalid file path');
    }

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
    // Sanitize and validate file path
    const sanitizedPath = sanitizePath(filePath);
    if (!sanitizedPath || sanitizedPath !== filePath) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(sanitizedPath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(sanitizedPath);
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath: string): Promise<void> {
    // Sanitize and validate file path
    const sanitizedPath = sanitizePath(filePath);
    if (!sanitizedPath || sanitizedPath !== filePath) {
      throw new Error('Invalid file path');
    }

    if (fs.existsSync(sanitizedPath)) {
      fs.unlinkSync(sanitizedPath);
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string) {
    // Sanitize and validate file path
    const sanitizedPath = sanitizePath(filePath);
    if (!sanitizedPath || sanitizedPath !== filePath) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(sanitizedPath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(sanitizedPath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.ctime,
    };
  }
}
