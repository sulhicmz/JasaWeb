/**
 * Project Validator
 * Centralized validation for project-related operations
 */

export interface ProjectValidationErrors {
  name?: string;
  type?: string;
  status?: string;
  url?: string;
  credentials?: string;
}

/**
 * Project validation utilities
 */
export class ProjectValidator {
  
  /**
   * Validate project type
   */
  static isValidProjectType(type: string): boolean {
    return ['sekolah', 'berita', 'company'].includes(type);
  }

  /**
   * Validate project status
   */
  static isValidProjectStatus(status: string): boolean {
    return ['pending_payment', 'in_progress', 'review', 'completed'].includes(status);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate project credentials JSON
   */
  static isValidCredentials(credentials: string): boolean {
    if (!credentials) return true; // Optional field
    
    try {
      const parsed = JSON.parse(credentials);
      const hasRequiredFields = parsed.admin_url || parsed.username || parsed.password;
      return typeof parsed === 'object' && hasRequiredFields;
    } catch {
      return false;
    }
  }

  /**
   * Validate required project fields
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
   * Validate complete project data
   */
  static validateProject(data: any, isUpdate = false): ProjectValidationErrors {
    const errors: ProjectValidationErrors = {};

    // Name validation
    if (data.name) {
      if (data.name.trim().length < 3) {
        errors.name = 'Nama proyek minimal 3 karakter';
      }
    } else if (!isUpdate) {
      errors.name = 'Nama proyek wajib diisi';
    }

    // Type validation
    if (data.type) {
      if (!this.isValidProjectType(data.type)) {
        errors.type = 'Tipe proyek tidak valid (sekolah, berita, company)';
      }
    } else if (!isUpdate) {
      errors.type = 'Tipe proyek wajib diisi';
    }

    // Status validation
    if (data.status) {
      if (!this.isValidProjectStatus(data.status)) {
        errors.status = 'Status proyek tidak valid';
      }
    }

    // URL validation (optional)
    if (data.url && data.url.trim() !== '') {
      if (!this.isValidUrl(data.url)) {
        errors.url = 'Format URL tidak valid';
      }
    }

    // Credentials validation (optional)
    if (data.credentials && typeof data.credentials === 'string') {
      if (!this.isValidCredentials(data.credentials)) {
        errors.credentials = 'Format credentials tidak valid (gunakan format JSON)';
      }
    }

    return errors;
  }

  /**
   * Check if validation errors exist
   */
  static hasErrors(errors: ProjectValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /**
   * Convert validation errors to string
   */
  static errorsToString(errors: ProjectValidationErrors): string {
    const messages = Object.values(errors).filter(Boolean);
    return messages.join(', ');
  }

  /**
   * Get user-friendly field labels
   */
  private static getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Nama Proyek',
      type: 'Tipe Proyek',
      status: 'Status',
      url: 'URL Proyek',
      credentials: 'Credentials'
    };
    return labels[field] || field;
  }
}