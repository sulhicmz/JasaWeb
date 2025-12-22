/**
 * Profile Service
 * Client-side service for profile management operations
 * Extends Window interface for proper TypeScript integration
 */

interface ApiResponse {
  message?: string;
  error?: string;
}

export class ProfileClientService {
  private static instance: ProfileClientService;

  private constructor() {}

  static getInstance(): ProfileClientService {
    if (!ProfileClientService.instance) {
      ProfileClientService.instance = new ProfileClientService();
    }
    return ProfileClientService.instance;
  }

  private showMessage(container: Element | null, message: string, type: 'success' | 'error'): void {
    if (!container) return;
    
    const messageHtml = `<div class="form-message ${type}" style="display: block;">${message}</div>`;
    container.innerHTML = messageHtml;
  }

  private async submitForm(endpoint: string, data: unknown): Promise<ApiResponse> {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  /**
   * Update user profile information
   */
  async updateProfile(formData: FormData): Promise<void> {
    const msgContainer = document.getElementById('profileMessageContainer');
    
    try {
      const data = await this.submitForm('/api/client/profile', {
        name: formData.get('name'),
        phone: formData.get('phone'),
      });

      const message = data.message || data.error || 'Berhasil disimpan';
      const type = data.message ? 'success' : 'error';
      
      this.showMessage(msgContainer, message, type);
    } catch {
      this.showMessage(msgContainer, 'Terjadi kesalahan', 'error');
    }
  }

  /**
   * Update user password
   */
  async updatePassword(formData: FormData): Promise<boolean> {
    const msgContainer = document.getElementById('passwordMessageContainer');
    
    // Validate password confirmation
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (newPassword !== confirmPassword) {
      this.showMessage(msgContainer, 'Password tidak cocok', 'error');
      return false;
    }

    try {
      const data = await this.submitForm('/api/client/password', {
        currentPassword: formData.get('currentPassword'),
        newPassword: newPassword,
      });

      const message = data.message || data.error || 'Password diubah';
      const type = data.message ? 'success' : 'error';
      
      this.showMessage(msgContainer, message, type);
      
      return data.message ? true : false;
    } catch {
      this.showMessage(msgContainer, 'Terjadi kesalahan', 'error');
      return false;
    }
  }

  /**
   * Initialize profile form event handlers
   */
  initializeProfileForm(): void {
    const profileForm = document.getElementById('profileForm') as HTMLFormElement;
    
    profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      await this.updateProfile(formData);
    });
  }

  /**
   * Initialize password form event handlers
   */
  initializePasswordForm(): void {
    const passwordForm = document.getElementById('passwordForm') as HTMLFormElement;
    
    passwordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(passwordForm);
      const success = await this.updatePassword(formData);
      
      if (success) {
        passwordForm.reset();
      }
    });
  }

  /**
   * Initialize all profile page functionality
   */
  initialize(): void {
    this.initializeProfileForm();
    this.initializePasswordForm();
  }
}

// Extend Window interface for global access
declare global {
  interface Window {
    profileService?: ProfileClientService;
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.profileService = ProfileClientService.getInstance();
    window.profileService.initialize();
  });
} else if (typeof window !== 'undefined') {
  window.profileService = ProfileClientService.getInstance();
  window.profileService.initialize();
}

export default ProfileClientService;