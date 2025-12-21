/**
 * Billing Service - Atomic billing statistics and invoice calculations
 * 
 * Extracted from billing.astro to eliminate inline business logic duplication
 * and provide reusable billing utilities across the application.
 */

export interface Invoice {
  id: string;
  amount: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  paidAt?: string;
  qrisUrl?: string;
  project: {
    name: string;
    type: string;
  };
}

export interface BillingStats {
  totalAmount: number;
  unpaidAmount: number;
  paidAmount: number;
  unpaidCount: number;
  paidCount: number;
}

export interface InvoiceState {
  currentPage: number;
  currentStatus: string;
  currentSort: string;
  isLoading: boolean;
  cache: Map<string, any>;
}

/**
 * Calculate billing statistics from invoice array
 * Optimized single-pass computation with proper typing
 */
export function calculateBillingStats(invoices: Invoice[]): BillingStats {
  const totals = invoices.reduce((acc, invoice) => {
    const amount = Number(invoice.amount);
    acc.total += amount;
    (acc as any)[invoice.status] = ((acc as any)[invoice.status] || 0) + amount;
    acc.count[invoice.status] = (acc.count[invoice.status] || 0) + 1;
    return acc;
  }, { total: 0, count: {} as Record<string, number> } as any);

  return {
    totalAmount: totals.total,
    unpaidAmount: (totals as any).unpaid || 0,
    paidAmount: (totals as any).paid || 0,
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
export function generateInvoiceCard(invoice: Invoice): string {
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
export function generateInvoiceDetailHTML(invoice: Invoice, paymentStatus?: string, expired?: boolean): string {
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
export function generateQRISPaymentHTML(invoice: Invoice, qrisUrl: string, orderId: string): string {
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
}): Promise<{ invoices: Invoice[]; pagination?: any } | null> {
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