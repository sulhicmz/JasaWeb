/**
 * User Validator
 * Centralized validation for user-related operations
 */

export interface UserValidationErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  role?: string;
}

/**
 * User validation utilities
 */
export class UserValidator {
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Validate phone number format (Indonesian format)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+62|62|08)[0-9]{8,13}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate user role
   */
  static isValidRole(role: string): boolean {
    return ['admin', 'client'].includes(role);
  }

  /**
   * Validate required user fields
   */
  static validateRequired(data: any, fields: string[]): string | null {
    for (const field of fields) {
      if (!data[field] || data[field].toString().trim() === '') {
        return this.getFieldLabel(field) + ' wajib diisi';
      }
    }
    return null;
  }

  /**
   * Validate complete user data
   */
  static validateUser(data: any, isUpdate = false): UserValidationErrors {
    const errors: UserValidationErrors = {};

    // Email validation
    if (data.email) {
      if (!this.isValidEmail(data.email)) {
        errors.email = 'Format email tidak valid';
      }
    } else if (!isUpdate) {
      errors.email = 'Email wajib diisi';
    }

    // Password validation (only for create)
    if (data.password && !isUpdate) {
      if (!this.isValidPassword(data.password)) {
        errors.password = 'Password minimal 8 karakter';
      }
    } else if (!data.password && !isUpdate) {
      errors.password = 'Password wajib diisi';
    }

    // Name validation
    if (data.name) {
      if (data.name.trim().length < 2) {
        errors.name = 'Nama minimal 2 karakter';
      }
    } else if (!isUpdate) {
      errors.name = 'Nama wajib diisi';
    }

    // Phone validation (optional)
    if (data.phone && data.phone.trim() !== '') {
      if (!this.isValidPhone(data.phone)) {
        errors.phone = 'Format nomor telepon tidak valid (contoh: 08123456789)';
      }
    }

    // Role validation (admin only)
    if (data.role && !this.isValidRole(data.role)) {
      errors.role = 'Role tidak valid';
    }

    return errors;
  }

  /**
   * Check if validation errors exist
   */
  static hasErrors(errors: UserValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /**
   * Convert validation errors to string
   */
  static errorsToString(errors: UserValidationErrors): string {
    const messages = Object.values(errors).filter(Boolean);
    return messages.join(', ');
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
      role: 'Role'
    };
    return labels[field] || field;
  }
}