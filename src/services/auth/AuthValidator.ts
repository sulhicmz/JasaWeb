/**
 * Auth Validator - Client-side validation rules for authentication forms
 * Extracted from inline validation in register.astro for reusability
 */

import type { AuthFormData } from './AuthFormHandler';

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export class AuthValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email wajib diisi' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format email tidak valid' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate password strength and length
   */
  static validatePassword(password: string): ValidationResult {
    if (!password || password.trim() === '') {
      return { isValid: false, error: 'Password wajib diisi' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password minimal 8 karakter' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate required field
   */
  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, error: `${fieldName} wajib diisi` };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate phone number (Indonesian format)
   */
  static validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim() === '') {
      return { isValid: true, error: null }; // Phone is optional
    }

    const phoneRegex = /^(?:\+62|62|0)[0-9]{9,13}$/;
    
    if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
      return { isValid: false, error: 'Format nomor WhatsApp tidak valid' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate name (alpha characters and spaces)
   */
  static validateName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
      return { isValid: false, error: 'Nama lengkap wajib diisi' };
    }

    if (name.length < 2) {
      return { isValid: false, error: 'Nama minimal 2 karakter' };
    }

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: 'Nama hanya boleh mengandung huruf dan spasi' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate password confirmation
   */
  static validatePasswordConfirmation(
    password: string,
    confirmPassword: string
  ): ValidationResult {
    if (!confirmPassword || confirmPassword.trim() === '') {
      return { isValid: false, error: 'Konfirmasi password wajib diisi' };
    }

    if (password !== confirmPassword) {
      return { isValid: false, error: 'Password tidak cocok' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Complete validation for login form
   */
  static validateLogin(data: AuthFormData): ValidationResult {
    const emailResult = this.validateEmail(data.email);
    if (!emailResult.isValid) return emailResult;

    const passwordResult = this.validatePassword(data.password);
    return passwordResult;
  }

  /**
   * Complete validation for registration form
   */
  static validateRegister(data: AuthFormData): ValidationResult {
    // Validate name
    if (!data.name) {
      return { isValid: false, error: 'Nama lengkap wajib diisi' };
    }
    const nameResult = this.validateName(data.name);
    if (!nameResult.isValid) return nameResult;

    // Validate email
    const emailResult = this.validateEmail(data.email);
    if (!emailResult.isValid) return emailResult;

    // Validate phone (optional)
    if (data.phone) {
      const phoneResult = this.validatePhone(data.phone);
      if (!phoneResult.isValid) return phoneResult;
    }

    // Validate password
    const passwordResult = this.validatePassword(data.password);
    if (!passwordResult.isValid) return passwordResult;

    // Validate password confirmation
    const confirmResult = this.validatePasswordConfirmation(
      data.password,
      data.confirmPassword || ''
    );
    return confirmResult;
  }

  /**
   * Create validation function for AuthFormHandler
   */
  static createValidator(type: 'login' | 'register') {
    return (data: AuthFormData): string | null => {
      const result = type === 'login' 
        ? this.validateLogin(data)
        : this.validateRegister(data);
      
      return result.error;
    };
  }
}