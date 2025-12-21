/**
 * Header Client Controller
 * Mobile menu toggle logic extracted from Header.astro
 */
export class HeaderClientController {
  /**
   * Initialize mobile menu toggle functionality
   */
  static initializeMobileMenu(): void {
    const btn = document.getElementById('mobileMenuBtn');
    const links = document.getElementById('navLinks');
    
    btn?.addEventListener('click', () => {
      links?.classList.toggle('open');
    });
  }

  /**
   * Auto-initialize when DOM is ready
   */
  static autoInitialize(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeMobileMenu();
      });
    } else {
      this.initializeMobileMenu();
    }
  }
}

// Auto-initialize for immediate usage
HeaderClientController.autoInitialize();