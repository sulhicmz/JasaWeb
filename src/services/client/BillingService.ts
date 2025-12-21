/**
 * Billing Service - Atomic billing statistics and invoice calculations
 * 
 * Extracted from billing.astro to eliminate inline business logic duplication
 * and provide reusable billing utilities across the application.
 */

import type { Invoice } from '@/lib/types';

export interface BillingStats {
  totalAmount: number;
  unpaidAmount: number;
  paidAmount: number;
  unpaidCount: number;
  paidCount: number;
}

// Extended Invoice with Project data for billing operations
export interface InvoiceWithProject extends Invoice {
  project: {
    name: string;
    type: string;
  };
}

// Temporary accumulator interface for reduce function
interface BillingAccumulator {
  total: number;
  count: Record<string, number>;
  [key: string]: number | Record<string, number>;
}

export interface InvoiceState {
  currentPage: number;
  currentStatus: string;
  currentSort: string;
  isLoading: boolean;
  cache: Map<string, unknown>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calculate billing statistics from invoice array
 * Optimized single-pass computation with proper typing
 */
export function calculateBillingStats(invoices: InvoiceWithProject[]): BillingStats {
  const totals = invoices.reduce((acc, invoice) => {
    const amount = Number(invoice.amount);
    acc.total += amount;
    (acc[invoice.status] as number) = ((acc[invoice.status] as number) || 0) + amount;
    acc.count[invoice.status] = (acc.count[invoice.status] || 0) + 1;
    return acc;
  }, { total: 0, count: {} as Record<string, number> } as BillingAccumulator);

  return {
    totalAmount: totals.total,
    unpaidAmount: (totals.unpaid as number) || 0,
    paidAmount: (totals.paid as number) || 0,
    unpaidCount: totals.count.unpaid || 0,
    paidCount: totals.count.paid || 0
  };
}

/**
 * Format currency amount in Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Generate HTML for billing statistics display
 * Optimized template literal with proper escaping
 */
export function generateStatsHTML(stats: BillingStats): string {
  return `
    <div class="stat-card">
      <div class="stat-label">Total Tagihan</div>
      <div class="stat-value">${formatCurrency(stats.totalAmount)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Belum Dibayar</div>
      <div class="stat-value">${formatCurrency(stats.unpaidAmount)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Sudah Dibayar</div>
      <div class="stat-value">${formatCurrency(stats.paidAmount)}</div>
    </div>
  `;
}

/**
 * Generate HTML for invoice card display
 * Type-safe template with consistent formatting
 */
export function generateInvoiceCard(invoice: InvoiceWithProject): string {
  const statusClass = invoice.status === 'paid' ? 'badge-success' : 'badge-secondary';
  const statusText = invoice.status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar';
  const paidDateText = invoice.paidAt 
    ? `Dibayar: ${new Date(invoice.paidAt).toLocaleDateString('id-ID')}` 
    : '';

  return `
    <div class="invoice-card">
      <div class="invoice-info">
        <div class="invoice-project">${invoice.project.name}</div>
        <div class="invoice-meta">
          ${invoice.project.type} • Invoice ID: ${invoice.id.slice(-8)}
        </div>
        <div class="invoice-amount">${formatCurrency(Number(invoice.amount))}</div>
        <div class="invoice-meta">
          Dibuat: ${new Date(invoice.createdAt).toLocaleDateString('id-ID')}
        </div>
      </div>
      <div class="invoice-actions">
        <div class="invoice-status">
          <span class="badge ${statusClass}">${statusText}</span>
          <div class="invoice-date">${paidDateText}</div>
        </div>
        <div class="invoice-buttons">
          <button class="button button-secondary button-sm" onclick="showInvoiceDetails('${invoice.id}')">
            Detail
          </button>
          ${invoice.status === 'unpaid' ? `
            <button class="button button-primary button-sm" onclick="createPayment('${invoice.id}')">
              Bayar
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create invoice detail HTML for modal display
 */
export function generateInvoiceDetailHTML(invoice: InvoiceWithProject, paymentStatus?: string, expired?: boolean): string {
  return `
    <div class="invoice-details">
      <div class="detail-row">
        <span class="label">Invoice ID:</span>
        <span>${invoice.id}</span>
      </div>
      <div class="detail-row">
        <span class="label">Proyek:</span>
        <span>${invoice.project.name}</span>
      </div>
      <div class="detail-row">
        <span class="label">Tipe:</span>
        <span>${invoice.project.type}</span>
      </div>
      <div class="detail-row">
        <span class="label">Nominal:</span>
        <span class="amount">${formatCurrency(Number(invoice.amount))}</span>
      </div>
      <div class="detail-row">
        <span class="label">Status:</span>
        <span class="badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-secondary'}">
          ${invoice.status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar'}
        </span>
      </div>
      <div class="detail-row">
        <span class="label">Dibuat:</span>
        <span>${new Date(invoice.createdAt).toLocaleString('id-ID')}</span>
      </div>
      ${invoice.paidAt ? `
        <div class="detail-row">
          <span class="label">Dibayar:</span>
          <span>${new Date(invoice.paidAt).toLocaleString('id-ID')}</span>
        </div>
      ` : ''}
      ${paymentStatus ? `
        <div class="detail-row">
          <span class="label">Payment Status:</span>
          <span>${paymentStatus}</span>
        </div>
      ` : ''}
      ${expired ? '<p style="color: var(--color-error);">Invoice expired</p>' : ''}
    </div>
  `;
}

/**
 * Generate QRIS payment HTML for modal display
 */
export function generateQRISPaymentHTML(invoice: InvoiceWithProject, qrisUrl: string, orderId: string): string {
  return `
    <div class="qris-container">
      <h4>Scan QRIS untuk Pembayaran</h4>
      <div class="qris-amount">${formatCurrency(invoice.amount)}</div>
      <div class="qris-timer" id="paymentTimer">24:00</div>
      
      <div class="qris-qr">
        <img src="${qrisUrl}" alt="QRIS Code" style="max-width: 300px; width: 100%; border-radius: var(--radius-lg);" />
      </div>
      
      <div class="qris-instructions">
        <p>1. Scan QR code dengan aplikasi e-wallet</p>
        <p>2. Masukkan nominal yang tepat</p>
        <p>3. Selesaikan pembayaran</p>
      </div>
      
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
        <button class="button button-secondary" onclick="checkPaymentStatus('${orderId}')">
          Cek Status
        </button>
        <button class="button button-secondary" onclick="closePaymentModal()">
          Tutup
        </button>
      </div>
    </div>
  `;
}

/**
 * Initialize billing state with defaults
 */
export function createBillingState(): InvoiceState {
  return {
    currentPage: 1,
    currentStatus: '',
    currentSort: 'createdAt',
    isLoading: false,
    cache: new Map()
  };
}

/**
 * Fetch billing statistics from API with error handling
 */
export async function fetchBillingStats(): Promise<{ invoices: Invoice[] } | null> {
  try {
    const response = await fetch('/api/client/invoices');
    if (!response.ok) {
      console.error('Failed to fetch billing stats:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return null;
  }
}

/**
 * Fetch paginated invoices with filtering and sorting
 */
export async function fetchInvoices(params: {
  page: number;
  status?: string;
  sortBy: string;
  sortOrder?: string;
  limit?: number;
}): Promise<{ invoices: InvoiceWithProject[]; pagination?: unknown } | null> {
  try {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: (params.limit || 10).toString(),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
      ...(params.status && { status: params.status })
    });

    const response = await fetch(`/api/client/invoices?${searchParams}`);
    if (!response.ok) {
      console.error('Failed to fetch invoices:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return null;
  }
}

/**
 * Billing Service Class - Encapsulates all billing operations
 * Provides clean interface for billing dashboard interactions
 */
export class BillingService {
  
  /**
   * Initialize billing state with defaults
   */
  public createState(): InvoiceState {
    return createBillingState();
  }

  /**
   * Inject billing styles into DOM
   */
  public injectStyles(): void {
    if (document.getElementById('billing-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'billing-styles';
    style.textContent = getBillingStyles();
    document.head.appendChild(style);
  }

  /**
   * Fetch billing statistics from API with error handling
   */
  public async fetchBillingStats(): Promise<{ invoices: Invoice[] } | null> {
    return fetchBillingStats();
  }

  /**
   * Fetch paginated invoices with filtering and sorting
   */
  public async fetchInvoices(params: {
    page: number;
    status?: string;
    sortBy: string;
    sortOrder?: string;
    limit?: number;
  }): Promise<{ invoices: InvoiceWithProject[]; pagination?: unknown } | null> {
    return fetchInvoices(params);
  }

  /**
   * Render overview statistics in DOM
   */
  public renderOverviewStats(invoices: Invoice[]): void {
    const invoiceData = invoices as InvoiceWithProject[];
    const stats = calculateBillingStats(invoiceData);
    const container = document.getElementById('overviewStats');
    
    if (container) {
      container.innerHTML = generateStatsHTML(stats);
    }
  }

  /**
   * Render invoices list in DOM
   */
  public renderInvoices(invoices: InvoiceWithProject[], pagination?: unknown): void {
    const container = document.getElementById('invoicesList');
    if (!container) return;

    if (invoices.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Tidak ada invoice ditemukan.</p>';
      return;
    }

    const invoicesHTML = invoices.map(invoice => generateInvoiceCard(invoice)).join('');
    container.innerHTML = invoicesHTML;

    // Render pagination if available
    if (pagination && this.isValidPagination(pagination)) {
      this.renderPagination(pagination);
    }
  }

  /**
   * Validate pagination data
   */
  private isValidPagination(pagination: unknown): pagination is PaginationInfo {
    return pagination !== null && 
           typeof pagination === 'object' &&
           'page' in pagination &&
           'limit' in pagination &&
           'total' in pagination &&
           'totalPages' in pagination &&
           'hasNext' in pagination &&
           'hasPrev' in pagination;
  }

  /**
   * Render pagination controls
   */
  private renderPagination(pagination: PaginationInfo): void {
    const container = document.getElementById('paginationControls');
    if (!container || !pagination) return;

    const { page, totalPages, hasNext, hasPrev } = pagination;
    
    let paginationHTML = '<div class="pagination">';
    
    if (hasPrev) {
      paginationHTML += `<button class="button button-secondary button-sm" data-action="change-page" data-page="${page - 1}">← Previous</button>`;
    }
    
    paginationHTML += `<span style="margin: 0 1rem;">Page ${page} of ${totalPages}</span>`;
    
    if (hasNext) {
      paginationHTML += `<button class="button button-secondary button-sm" data-action="change-page" data-page="${page + 1}">Next →</button>`;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
  }

  /**
   * Show invoice details modal
   */
  public async showInvoiceDetails(invoiceId: string): Promise<void> {
    try {
      const response = await fetch(`/api/client/invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Failed to fetch invoice details');
      
      const invoice = await response.json();
      const invoiceDetailHTML = generateInvoiceDetailHTML(invoice);
      
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Invoice Details</h3>
          ${invoiceDetailHTML}
          <div style="margin-top: 1.5rem; text-align: right;">
            <button class="button button-secondary" data-action="close-payment-modal">Close</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add styles
      if (!document.getElementById('billing-modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'billing-modal-styles';
        modalStyles.textContent = `
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: var(--color-bg-secondary);
            padding: 2rem;
            border-radius: var(--radius-lg);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
          }
        `;
        document.head.appendChild(modalStyles);
      }
      
    } catch (error) {
      console.error('Error showing invoice details:', error);
      alert('Gagal memuat detail invoice. Silakan coba lagi.');
    }
  }

  /**
   * Create payment for invoice
   */
  public async createPayment(invoiceId: string): Promise<void> {
    try {
      const response = await fetch(`/api/client/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to create payment');
      
      const paymentData = await response.json();
      
      if (paymentData.qrisUrl && paymentData.orderId) {
        const invoice = await fetch(`/api/client/invoices/${invoiceId}`).then(res => res.json());
        const qrisHTML = generateQRISPaymentHTML(invoice, paymentData.qrisUrl, paymentData.orderId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'paymentModal';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 400px;">
            ${qrisHTML}
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start payment timer
        this.startPaymentTimer(paymentData.orderId);
        
      } else {
        alert('Gagal membuat pembayaran. Silakan coba lagi.');
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Gagal membuat pembayaran. Silakan coba lagi.');
    }
  }

  /**
   * Check payment status
   */
  public async checkPaymentStatus(orderId: string): Promise<void> {
    try {
      const response = await fetch(`/api/client/payment/status?orderId=${orderId}`);
      if (!response.ok) throw new Error('Failed to check payment status');
      
      const status = await response.json();
      
      if (status.status === 'success') {
        alert('Pembayaran berhasil! Invoice telah diperbarui.');
        this.closePaymentModal();
        // Reload invoices
        window.location.reload();
      } else if (status.status === 'pending') {
        alert('Pembayaran masih pending. Silakan coba lagi beberapa saat.');
      } else if (status.status === 'expired') {
        alert('Pembayaran telah kadaluarsa. Silakan buat pembayaran baru.');
        this.closePaymentModal();
      } else {
        alert('Status pembayaran tidak diketahui.');
      }
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert('Gagal memeriksa status pembayaran. Silakan coba lagi.');
    }
  }

  /**
   * Close payment modal
   */
  public closePaymentModal(): void {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.remove();
    }
    
    // Clear payment timer
    if (window.paymentInterval) {
      clearInterval(window.paymentInterval);
      window.paymentInterval = undefined;
    }
    if (window.paymentTimerInterval) {
      clearInterval(window.paymentTimerInterval);
      window.paymentTimerInterval = undefined;
    }
  }

  /**
   * Start payment timer
   */
  private startPaymentTimer(orderId: string): void {
    let timeLeft = 24 * 60; // 24 minutes in seconds
    
    // Update timer display
    const updateTimer = () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timerElement = document.getElementById('paymentTimer');
      
      if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (timeLeft <= 0) {
        this.closePaymentModal();
        alert('Pembayaran telah kadaluarsa.');
        return;
      }
      
      timeLeft--;
    };
    
    updateTimer();
    window.paymentTimerInterval = window.setInterval(updateTimer, 1000);
    
    // Auto check payment status every 5 seconds
    window.paymentInterval = window.setInterval(() => {
      this.checkPaymentStatus(orderId);
    }, 5000);
  }
}

/**
 * Get CSS styles for billing components
 * Centralized styling to ensure consistency across pages
 */
export function getBillingStyles(): string {
  return `
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-success {
      background: var(--color-success);
      color: white;
    }
    .badge-secondary {
      background: var(--color-secondary);
      color: white;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    .amount {
      font-weight: 600;
      font-size: 1.125rem;
    }
    .button {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .button-secondary {
      background: var(--color-bg-secondary);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .button-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
    .button:hover {
      opacity: 0.9;
    }
    .qris-container {
      text-align: center;
      padding: 2rem;
    }
    .qris-timer {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-error);
      margin: 1rem 0;
    }
    .qris-instructions {
      color: var(--color-text-secondary);
      margin-top: 1rem;
    }
  `;
}