/**
 * Security Configuration Enhancement
 * Added additional security-related configurations
 */

import { SecurityConfigService } from './security-config.service';
import { Injectable } from '@nestjs/common';

/**
 * Enhanced security validations for common attack vectors
 */
@Injectable()
export class SecurityValidationService {
  // List of dangerous file extensions that shouldn't be allowed
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.ps1',
    '.sh',
    '.php',
    '.asp',
    '.aspx',
    '.jsp',
    '.py',
    '.rb',
    '.pl',
  ];

  // List of suspicious patterns in filenames
  private static readonly SUSPICIOUS_PATTERNS = [
    /\.\./, // Directory traversal
    /[<>:"|?*]/, // Invalid characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names
  ];

  /**
   * Validates filename for security issues
   */
  static validateFilename(filename: string): {
    isValid: boolean;
    reason?: string;
  } {
    if (!filename || typeof filename !== 'string') {
      return { isValid: false, reason: 'Invalid filename' };
    }

    // Check for dangerous extensions
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
      return { isValid: false, reason: 'Dangerous file extension' };
    }

    // Check for suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(filename)) {
        return { isValid: false, reason: 'Suspicious filename pattern' };
      }
    }

    return { isValid: true };
  }

  /**
   * Sanitizes user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validates file size against reasonable limits
   */
  static validateFileSize(
    size: number,
    maxSize: number = 50 * 1024 * 1024
  ): { isValid: boolean; reason?: string } {
    if (!Number.isInteger(size) || size < 0) {
      return { isValid: false, reason: 'Invalid file size' };
    }

    if (size > maxSize) {
      return {
        isValid: false,
        reason: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      };
    }

    return { isValid: true };
  }
}
