/**
 * Validation utility functions for JasaWeb monorepo
 */

/**
 * Validates that a value is not null or undefined
 */
export const isNotNull = <T>(value: T | null | undefined): value is T => {
  return value != null;
};

/**
 * Validates that a string is not empty
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value != null && value.trim().length > 0;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a value is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates phone number format (international format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic international phone validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};