/**
 * Auth Form Service - Centralized authentication form handling
 * Extracted from login.astro and register.astro to eliminate code duplication
 */

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  confirmPassword?: string;
}

export interface AuthFormConfig {
  endpoint: string;
  successRedirect: string;
  successMessage?: string;
  errorMessage?: string;
  validation?: (data: AuthFormData) => string | null;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

export class AuthFormHandler {
  private static errorElement: HTMLElement | null = null;
  private static successElement: HTMLElement | null = null;

  /**
   * Initialize form handler with error/success message elements
   */
  static initialize(
    errorElementId: string = 'errorMessage',
    successElementId: string = 'successMessage'
  ): boolean {
    try {
      this.errorElement = document.getElementById(errorElementId);
      this.successElement = document.getElementById(successElementId);

      if (!this.errorElement) {
        console.error(`Error element #${errorElementId} not found`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Form handler initialization failed:', error);
      return false;
    }
  }

  /**
   * Handle form submission with generic authentication flow
   */
  static async handleSubmit(
    form: HTMLFormElement,
    config: AuthFormConfig
  ): Promise<void> {
    try {
      // Call submit start callback
      config.onSubmitStart?.();
      
      // Hide previous messages
      this.hideMessages();

      // Extract form data
      const formData = new FormData(form);
      const data: AuthFormData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        confirmPassword: formData.get('confirmPassword') as string,
      };

      // Run client-side validation if provided
      if (config.validation) {
        const validationError = config.validation(data);
        if (validationError) {
          this.showError(validationError);
          return;
        }
      }

      // Clean data before sending
      const cleanedData = this.cleanFormData(data);

      // Send to API
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      // Handle response
      if (!response.ok) {
        this.showError((result as any).error || config.errorMessage || 'Operasi gagal');
        return;
      }

      // Show success message and redirect
      if (config.successMessage && this.successElement) {
        this.showSuccess(config.successMessage);
        await this.delay(1500);
      }

      window.location.href = config.successRedirect;
    } catch (error) {
      console.error('Form submission error:', error);
      this.showError(config.errorMessage || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      // Call submit end callback
      config.onSubmitEnd?.();
    }
  }

  /**
   * Attach form handler to a DOM form element
   */
  static attachToForm(
    formId: string,
    config: AuthFormConfig
  ): boolean {
    try {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) {
        console.error(`Form #${formId} not found`);
        return false;
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(form, config);
      });

      return true;
    } catch (error) {
      console.error('Failed to attach form handler:', error);
      return false;
    }
  }

  /**
   * Display error message
   */
  static showError(message: string): void {
    if (!this.errorElement) return;
    
    this.errorElement.textContent = message;
    this.errorElement.classList.add('show');
  }

  /**
   * Display success message
   */
  static showSuccess(message: string): void {
    if (!this.successElement) return;
    
    this.successElement.textContent = message;
    this.successElement.classList.add('show');
  }

  /**
   * Hide all messages
   */
  static hideMessages(): void {
    if (this.errorElement) {
      this.errorElement.classList.remove('show');
    }
    if (this.successElement) {
      this.successElement.classList.remove('show');
    }
  }

  /**
   * Clean form data by removing undefined fields and empty strings
   */
  private static cleanFormData(data: AuthFormData): Partial<AuthFormData> {
    const cleaned: Partial<AuthFormData> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        cleaned[key as keyof AuthFormData] = value;
      }
    });

    // Remove confirmPassword before sending to API
    if ('confirmPassword' in cleaned) {
      delete cleaned.confirmPassword;
    }

    return cleaned;
  }

  /**
   * Helper function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback error display for critical initialization failures
   */
  static showFallbackError(message: string): void {
    document.body.insertAdjacentHTML('beforeend', 
      `<div style="color: var(--color-error); text-align: center; padding: 1rem;">${message}</div>`
    );
  }
}