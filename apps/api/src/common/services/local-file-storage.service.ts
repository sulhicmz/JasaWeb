import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Allowed base directories for uploads
const ALLOWED_BASE_DIRECTORIES = [
  process.env.UPLOAD_DIR || '/tmp/uploads',
  '/tmp',
];

// Enhanced path security validation to prevent all traversal attacks
function validatePathSecurity(filePath: string, allowedBase: string): string {
  // Basic input validation - reject obvious dangerous patterns
  if (
    !filePath ||
    typeof filePath !== 'string' ||
    filePath.includes('..') ||
    filePath.includes('~') ||
    filePath.startsWith('/') ||
    filePath.startsWith('\\')
  ) {
    throw new Error('Invalid or dangerous file path detected');
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(allowedBase);

  // Strict parent directory prevention
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error(
      'Path traversal detected - access outside allowed directory'
    );
  }

  // Additional character sanitization
  const sanitizedPath = filePath
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();

  return sanitizedPath;
}

// Sanitize file paths to prevent directory traversal
function sanitizePath(filePath: string): string {
  return path
    .normalize(filePath)
    .replace(/\.\./g, '')
    .replace(/[/\\]+/g, '/');
}

// Validate directory path against allowed directories
function isValidDirectoryPath(dirPath: string): boolean {
  try {
    if (!dirPath || typeof dirPath !== 'string') {
      return false;
    }

    const sanitized = sanitizePath(dirPath);
    const resolvedPath = path.resolve(sanitized);

    // Check against all allowed base directories
    return ALLOWED_BASE_DIRECTORIES.some((allowedDir) => {
      const resolvedBase = path.resolve(allowedDir);
      return resolvedPath.startsWith(resolvedBase);
    });
  } catch (error) {
    return false;
  }
}

// Validate file path is within allowed directories
function isValidFilePath(filePath: string): boolean {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    const sanitized = sanitizePath(filePath);
    const resolvedPath = path.resolve(sanitized);

    // Check against all allowed base directories
    return ALLOWED_BASE_DIRECTORIES.some((allowedDir) => {
      const resolvedBase = path.resolve(allowedDir);
      return resolvedPath.startsWith(resolvedBase);
    });
  } catch (error) {
    return false;
  }
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
