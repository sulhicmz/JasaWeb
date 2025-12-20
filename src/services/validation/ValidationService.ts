/**
 * Validation Service
 * Orchestration service for all validation operations
 */

import type { ApiResponse } from '@/lib/types';
import { UserValidator, type UserValidationErrors } from './UserValidator';
import { ProjectValidator, type ProjectValidationErrors } from './ProjectValidator';

export type ValidationErrors = UserValidationErrors | ProjectValidationErrors;

/**
 * Validation orchestration utilities
 */
export class ValidationService {
  
  /**
   * Required field validation utility
   */
  static validateRequired(data: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        return `${this.getFieldLabel(field)} wajib diisi`;
      }
    }
    return null;
  }

  /**
   * Validate user data with comprehensive checks
   */
  static validateUser(data: any, isUpdate = false): ApiResponse<null> {
    const errors = UserValidator.validateUser(data, isUpdate);
    
    if (UserValidator.hasErrors(errors)) {
      return {
        success: false,
        error: UserValidator.errorsToString(errors)
      };
    }
    
    return { success: true };
  }

  /**
   * Validate project data with comprehensive checks
   */
  static validateProject(data: any, isUpdate = false): ApiResponse<null> {
    const errors = ProjectValidator.validateProject(data, isUpdate);
    
    if (ProjectValidator.hasErrors(errors)) {
      return {
        success: false,
        error: ProjectValidator.errorsToString(errors)
      };
    }
    
    return { success: true };
  }

  /**
   * Validate email format (utility method)
   */
  static isValidEmail(email: string): boolean {
    return UserValidator.isValidEmail(email);
  }

  /**
   * Validate password strength (utility method)
   */
  static isValidPassword(password: string): boolean {
    return UserValidator.isValidPassword(password);
  }

  /**
   * Validate URL format (utility method)
   */
  static isValidUrl(url: string): boolean {
    return ProjectValidator.isValidUrl(url);
  }

  /**
   * Get user-friendly field labels
   */
  private static getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      email: 'Email',
      password: 'Password',
      name: 'Nama',
      phone: 'Nomor Telepon',
      role: 'Role',
      projectName: 'Nama Proyek',
      projectType: 'Tipe Proyek',
      status: 'Status',
      url: 'URL',
      credentials: 'Credentials'
    };
    return labels[field] || field;
  }

  /**
   * Common validation pattern for API endpoints
   */
  static validateCommon(data: any, rules: {
    required?: string[];
    email?: string;
    password?: string;
    minLength?: Record<string, number>;
    pattern?: Record<string, RegExp>;
  }): ApiResponse<null> {
    // Check required fields
    if (rules.required) {
      const missingField = this.validateRequired(data, rules.required);
      if (missingField) {
        return { success: false, error: missingField };
      }
    }

    // Email validation
    if (rules.email && data[rules.email]) {
      if (!UserValidator.isValidEmail(data[rules.email])) {
        return { success: false, error: 'Format email tidak valid' };
      }
    }

    // Password validation
    if (rules.password && data[rules.password]) {
      if (!UserValidator.isValidPassword(data[rules.password])) {
        return { success: false, error: 'Password minimal 8 karakter' };
      }
    }

    // Minimum length validation
    if (rules.minLength) {
      for (const [field, minLength] of Object.entries(rules.minLength)) {
        if (data[field] && data[field].length < minLength) {
          return { 
            success: false, 
            error: `${this.getFieldLabel(field)} minimal ${minLength} karakter` 
          };
        }
      }
    }

    // Pattern validation
    if (rules.pattern) {
      for (const [field, pattern] of Object.entries(rules.pattern)) {
        if (data[field] && !pattern.test(data[field])) {
          return { 
            success: false, 
            error: `Format ${this.getFieldLabel(field)} tidak valid` 
          };
        }
      }
    }

    return { success: true };
  }
}