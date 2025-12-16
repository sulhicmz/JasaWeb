import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Allowed base directories for uploads
const ALLOWED_BASE_DIRECTORIES = [
  process.env.UPLOAD_DIR || '/tmp/uploads',
  '/tmp',
];

// Sanitize file paths to prevent directory traversal
function sanitizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\.\./g, '').replace(/\/+/g, '/');
}

// Validate directory path against allowed directories
function isValidDirectoryPath(dirPath: string): boolean {
  const sanitized = sanitizePath(dirPath);
  const resolvedPath = path.resolve(sanitized);

  return (
    sanitized === dirPath &&
    !sanitized.includes('..') &&
    ALLOWED_BASE_DIRECTORIES.some((allowedDir) =>
      resolvedPath.startsWith(path.resolve(allowedDir))
    )
  );
}

// Validate file path is within allowed directories
function isValidFilePath(filePath: string): boolean {
  const sanitized = sanitizePath(filePath);
  const resolvedPath = path.resolve(sanitized);

  return (
    sanitized === filePath &&
    !sanitized.includes('..') &&
    ALLOWED_BASE_DIRECTORIES.some((allowedDir) =>
      resolvedPath.startsWith(path.resolve(allowedDir))
    )
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
    // Use try-catch for filesystem operations to handle potential errors
    try {
      if (!fs.existsSync(options.directory)) {
        fs.mkdirSync(options.directory, { recursive: true, mode: 0o755 });
      }
    } catch (error) {
      throw new Error(
        `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
    try {
      fs.writeFileSync(filePath, fileBuffer, { mode: 0o644 });
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      filename: finalFilename,
      path: filePath,
    };
  }

  /**
   * Get file from local storage
   */
  async getFile(filePath: string): Promise<Buffer> {
    // Validate file path against allowed directories
    if (!isValidFilePath(filePath)) {
      throw new Error('Invalid file path');
    }

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      if (error instanceof Error && error.message === 'File not found') {
        throw error;
      }
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath: string): Promise<void> {
    // Validate file path against allowed directories
    if (!isValidFilePath(filePath)) {
      throw new Error('Invalid file path');
    }

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string) {
    // Validate file path against allowed directories
    if (!isValidFilePath(filePath)) {
      throw new Error('Invalid file path');
    }

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.ctime,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'File not found') {
        throw error;
      }
      throw new Error(
        `Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
