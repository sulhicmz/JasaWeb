import { join, normalize, resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';

// Simple console-based logger for security operations
const logger = {
  error: (message: string, error?: string) => {
    console.error(`[SecureFileOperations] ${message}`, error || '');
  },
  log: (message: string) => {
    console.log(`[SecureFileOperations] ${message}`);
  },
};

/**
 * Utility class for secure file operations with path validation
 * Prevents directory traversal and ensures safe file system access
 */
export class SecureFileOperations {
  private static readonly ALLOWED_BASE_PATHS = [
    process.cwd(),
    process.env.TMPDIR || '/tmp',
    '/var/tmp',
  ];

  /**
   * Validates and normalizes a file path to prevent directory traversal attacks
   */
  private static validatePath(filePath: string, basePath?: string): string {
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      throw new Error('File path must be a non-empty string');
    }

    // Remove null bytes and other dangerous characters
    const sanitizedPath = filePath.replace(/\0/g, '').trim();
    const normalizedPath = normalize(sanitizedPath);

    // Resolve relative paths
    const resolvedPath = resolve(basePath || process.cwd(), normalizedPath);

    // Ensure the resolved path is within allowed base paths
    const isAllowed = this.ALLOWED_BASE_PATHS.some((allowedPath) =>
      resolvedPath.startsWith(normalize(allowedPath))
    );

    if (!isAllowed) {
      throw new Error(`File path outside allowed directories: ${resolvedPath}`);
    }

    // Additional validation for dangerous patterns
    const dangerousPatterns = [
      /\.\.\//g, // Directory traversal
      /^[\\/]/, // Absolute paths (unless explicitly allowed)
    ];

    for (const pattern of dangerousPatterns) {
      if (
        pattern.test(sanitizedPath) &&
        !sanitizedPath.startsWith(process.cwd())
      ) {
        throw new Error(`Dangerous path pattern detected: ${sanitizedPath}`);
      }
    }

    return resolvedPath;
  }

  /**
   * Secure file read with path validation
   */
  static readFile(
    filePath: string,
    encoding: BufferEncoding = 'utf-8',
    basePath?: string
  ): string {
    const validatedPath = this.validatePath(filePath, basePath);

    try {
      // Path is validated by validatePath function above to prevent directory traversal
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return readFileSync(validatedPath as string, encoding);
    } catch (error) {
      logger.error(
        `Failed to read file: ${validatedPath}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Secure file write with path validation
   */
  static writeFile(
    filePath: string,
    content: string | Buffer,
    options?: { encoding?: BufferEncoding; mode?: number },
    basePath?: string
  ): void {
    const validatedPath = this.validatePath(filePath, basePath);

    // Ensure parent directory exists
    const parentDir = normalize(join(validatedPath, '..'));
    try {
      // Path is validated by validatePath function above to prevent directory traversal
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      mkdirSync(parentDir as string, { recursive: true });
    } catch (error) {
      logger.error(
        `Failed to create directory: ${parentDir}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }

    try {
      // Path is validated by validatePath function above to prevent directory traversal
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      writeFileSync(validatedPath, content, options);
    } catch (error) {
      logger.error(
        `Failed to write file: ${validatedPath}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Secure directory listing with path validation
   */
  static readDirectory(dirPath: string, basePath?: string): string[] {
    const validatedPath = this.validatePath(dirPath, basePath);

    try {
      // Path is validated by validatePath function above to prevent directory traversal
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return readdirSync(validatedPath, { encoding: 'utf-8' });
    } catch (error) {
      logger.error(
        `Failed to read directory: ${validatedPath}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Secure directory creation with path validation
   */
  static createDirectory(
    dirPath: string,
    options?: { recursive?: boolean },
    basePath?: string
  ): void {
    const validatedPath = this.validatePath(dirPath, basePath);

    try {
      // Path is validated by validatePath function above to prevent directory traversal
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      mkdirSync(validatedPath, options);
    } catch (error) {
      logger.error(
        `Failed to create directory: ${validatedPath}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Validates file name to prevent injection attacks
   */
  static validateFileName(fileName: string): string {
    if (typeof fileName !== 'string' || fileName.trim() === '') {
      throw new Error('File name must be a non-empty string');
    }

    // Remove dangerous characters and patterns
    const sanitized = fileName
      .replace(/[<>:"|?*]/g, '') // Remove invalid characters
      .replace(/\.\./g, '') // Remove directory traversal
      .replace(/[\\/]/g, '_') // Replace path separators
      .replace(/^\./, '_') // Replace leading dot
      .trim();

    if (sanitized === '') {
      throw new Error('File name is invalid after sanitization');
    }

    // Length limit
    if (sanitized.length > 255) {
      throw new Error('File name too long');
    }

    return sanitized;
  }
}
