/**
 * Billing Page Controller - Clean client-side controller for billing dashboard
 * 
 * Refactored from monolithic billing-client.ts to follow atomic modularity principles
 * and eliminate architectural violations. This controller only handles DOM interactions
 * while delegating all business logic to the BillingService.
 */

import { 
  BillingService,
  type InvoiceState
} from '@/services/client/BillingService';

declare global {
  interface Window {
    billingPageController?: BillingPageController;
    paymentInterval?: number;
    paymentTimerInterval?: number;
  }
}

export class BillingPageController {
  private service: BillingService;
  private state: InvoiceState;
  private debounceTimer: number | null = null;

  constructor() {
    this.service = new BillingService();
    this.state = this.service.createState();
  }

  /**
   * Initialize the billing dashboard with proper event delegation
   */
  public async initialize(): Promise<void> {
    // Add billing styles
    this.service.injectStyles();
    
    // Setup event delegation
    this.setupEventListeners();
    
    // Load initial data
    await this.loadInitialData();
    
    // Setup performance observers
    this.setupIntersectionObserver();
  }

  /**
   * Setup event delegation for all interactions
   */
  private setupEventListeners(): void {
    // Form controls - change events
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (!target) return;
      
      if (target.id === 'statusFilter') {
        this.handleStatusFilter(target.value);
      } else if (target.id === 'sortBy') {
        this.handleSortChange(target.value);
      }
    });

    // Button clicks - direct event delegation
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Handle button clicks with data attributes
      if (target.tagName === 'BUTTON') {
        this.handleButtonClick(target);
      }
    });
  }

  /**
   * Handle status filter changes
   */
  private handleStatusFilter(value: string): void {
    this.state.currentStatus = value;
    this.state.currentPage = 1;
    this.debouncedLoadInvoices();
  }

  /**
   * Handle sort changes
   */
  private handleSortChange(value: string): void {
    this.state.currentSort = value;
    this.state.currentPage = 1;
    this.debouncedLoadInvoices();
  }

  /**
   * Handle button clicks using data attributes for clean routing
   */
  private handleButtonClick(button: HTMLElement): void {
    const action = button.dataset.action;
    const invoiceId = button.dataset.invoiceId;
    const orderId = button.dataset.orderId;
    const page = button.dataset.page;

    switch (action) {
      case 'show-invoice-details':
        if (invoiceId) this.showInvoiceDetails(invoiceId);
        break;
      case 'create-payment':
        if (invoiceId) this.createPayment(invoiceId);
        break;
      case 'check-payment-status':
        if (orderId) this.checkPaymentStatus(orderId);
        break;
      case 'close-payment-modal':
        this.closePaymentModal();
        break;
      case 'change-page':
        if (page) this.changePage(parseInt(page));
        break;
    }
  }

  /**
   * Load initial dashboard data
   */
  private async loadInitialData(): Promise<void> {
    await Promise.all([
      this.loadOverviewStats(),
      this.loadInvoices()
    ]);
  }

  /**
   * Load overview statistics
   */
  private async loadOverviewStats(): Promise<void> {
    try {
      const data = await this.service.fetchBillingStats();
      if (data) {
        this.service.renderOverviewStats(data.invoices);
      }
    } catch (error) {
      console.error('Failed to load overview stats:', error);
    }
  }

  /**
   * Load invoices with current filters
   */
  private async loadInvoices(): Promise<void> {
    try {
      this.state.isLoading = true;
      const data = await this.service.fetchInvoices({
        page: this.state.currentPage,
        status: this.state.currentStatus,
        sortBy: this.state.currentSort
      });
      
      if (data) {
        this.service.renderInvoices(data.invoices, data.pagination);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Debounced invoice loading for performance
   */
  private debouncedLoadInvoices(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.loadInvoices();
    }, 300);
  }

  /**
   * Setup intersection observer for performance optimization
   */
  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadOverviewStats();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    const statsElement = document.getElementById('overviewStats');
    if (statsElement) {
      observer.observe(statsElement);
    }
  }

  /**
   * Show invoice details modal
   */
  private async showInvoiceDetails(invoiceId: string): Promise<void> {
    try {
      await this.service.showInvoiceDetails(invoiceId);
    } catch (error) {
      console.error('Failed to show invoice details:', error);
    }
  }

  /**
   * Create payment for invoice
   */
  private async createPayment(invoiceId: string): Promise<void> {
    try {
      await this.service.createPayment(invoiceId);
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  }

  /**
   * Check payment status
   */
  private async checkPaymentStatus(orderId: string): Promise<void> {
    try {
      await this.service.checkPaymentStatus(orderId);
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  }

  /**
   * Close payment modal
   */
  private closePaymentModal(): void {
    this.service.closePaymentModal();
  }

  /**
   * Change page
   */
  private changePage(page: number): void {
    this.state.currentPage = page;
    this.loadInvoices();
  }
}

// Auto-initialize when DOM is ready
const initializeBillingController = (): void => {
  const controller = new BillingPageController();
  
  // Make controller available globally for any legacy interactions
  window.billingPageController = controller;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => controller.initialize());
  } else {
    controller.initialize();
  }
};

// Initialize immediately
initializeBillingController();