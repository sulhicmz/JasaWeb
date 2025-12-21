/**
 * Billing Service - Client-side TypeScript implementation
 * 
 * This file contains the client-side logic for the billing dashboard,
 * extracted from inline JavaScript for better modularity.
 */

export {}; // Make this a module

// Extend Window interface for payment timers
declare global {
  interface Window {
    paymentInterval?: number;
    paymentTimerInterval?: number;
  }
}

// Global state management
interface BillingState {
  currentPage: number;
  currentStatus: string;
  currentSort: string;
  isLoading: boolean;
  cache: Map<string, any>;
}

const state: BillingState = {
  currentPage: 1,
  currentStatus: '',
  currentSort: 'createdAt',
  isLoading: false,
  cache: new Map()
};

// Debounce function for better performance
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format currency amount in Indonesian Rupiah
const formatCurrency = (amount: number): string => `Rp ${amount.toLocaleString('id-ID')}`;

// Calculate billing statistics from invoice array
const calculateBillingStats = (invoices: any[]) => {
  const totals = invoices.reduce((acc: any, invoice: any) => {
    const amount = Number(invoice.amount);
    acc.total += amount;
    acc[invoice.status] = (acc[invoice.status] || 0) + amount;
    acc.count[invoice.status] = (acc.count[invoice.status] || 0) + 1;
    return acc;
  }, { total: 0, count: {} });

  return {
    totalAmount: totals.total,
    unpaidAmount: totals.unpaid || 0,
    paidAmount: totals.paid || 0,
    unpaidCount: totals.count.unpaid || 0,
    paidCount: totals.count.paid || 0
  };
};

// Generate HTML for billing statistics display
const generateStatsHTML = (stats: any): string => {
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
};

// Generate HTML for invoice card display
const generateInvoiceCard = (invoice: any): string => {
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
};

// Generate invoice detail HTML for modal display
const generateInvoiceDetailHTML = (invoice: any, paymentStatus?: string, expired?: boolean): string => {
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
};

// Generate QRIS payment HTML for modal display
const generateQRISPaymentHTML = (invoice: any, qrisUrl: string, orderId: string): string => {
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
};

// Fetch billing statistics from API with error handling
const fetchBillingStats = async (): Promise<any | null> => {
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
};

// Fetch paginated invoices with filtering and sorting
const fetchInvoices = async (params: {
  page: number;
  status?: string;
  sortBy: string;
  sortOrder?: string;
  limit?: number;
}): Promise<any | null> => {
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
};

// Get CSS styles for billing components
const getBillingStyles = (): string => {
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
};

// Load overview statistics using service
const loadOverviewStats = async (): Promise<void> => {
  const data = await fetchBillingStats();
  if (!data || !data.invoices) {
    console.error('Failed to load stats');
    return;
  }

  const stats = calculateBillingStats(data.invoices);
  const statsContainer = document.getElementById('overviewStats');
  if (statsContainer) {
    statsContainer.innerHTML = generateStatsHTML(stats);
  }
};

// Update pagination controls
const updatePagination = (pagination: any): void => {
  const container = document.getElementById('pagination');
  const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
  const pageInfo = document.getElementById('pageInfo');

  if (!pagination || pagination.totalPages <= 1) {
    if (container) container.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'flex';
  if (prevBtn) prevBtn.disabled = !pagination.hasPrev;
  if (nextBtn) nextBtn.disabled = !pagination.hasNext;
  if (pageInfo) pageInfo.textContent = `Halaman ${pagination.page} dari ${pagination.totalPages}`;
};

// Load invoices list using service
const loadInvoices = async (): Promise<void> => {
  const container = document.getElementById('invoicesList');
  if (!container) return;

  try {
    const data = await fetchInvoices({
      page: state.currentPage,
      status: state.currentStatus || undefined,
      sortBy: state.currentSort,
      sortOrder: 'desc',
      limit: 10
    });

    if (!data || !data.invoices) {
      container.innerHTML = '<div class="empty-state"><p>Gagal memuat tagihan</p></div>';
      return;
    }

    if (data.invoices.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Belum ada tagihan</p></div>';
      return;
    }

    // Render invoice cards using service
    container.innerHTML = data.invoices.map((invoice: any) => generateInvoiceCard(invoice)).join('');
    updatePagination(data.pagination);
  } catch (error) {
    console.error('Error loading invoices:', error);
    container.innerHTML = '<div class="empty-state"><p>Terjadi kesalahan</p></div>';
  }
};

// Change page - used via onclick in HTML
const changePage = (direction: number): void => {
  state.currentPage += direction;
  loadInvoices();
};

// Show invoice details using service
const showInvoiceDetails = async (invoiceId: string): Promise<void> => {
  const modal = document.getElementById('invoiceModal');
  const content = document.getElementById('invoiceContent');

  if (!modal || !content) return;

  try {
    const params = new URLSearchParams({ invoiceId });
    const res = await fetch(`/api/client/payment?${params}`);
    const data = await res.json();

    if (!res.ok) {
      content.innerHTML = '<p>Gagal memuat detail invoice</p>';
      return;
    }

    content.innerHTML = generateInvoiceDetailHTML(
      data.invoice, 
      data.paymentStatus, 
      data.expired
    );

    modal.style.display = 'flex';
  } catch (error) {
    console.error('Error showing invoice details:', error);
    content.innerHTML = '<p>Terjadi kesalahan</p>';
    modal.style.display = 'flex';
  }
};

// Create payment using service
const createPayment = async (invoiceId: string): Promise<void> => {
  const modal = document.getElementById('paymentModal');
  const content = document.getElementById('paymentContent');

  if (!modal || !content) return;

  try {
    const res = await fetch('/api/client/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId })
    });

    const data = await res.json();

    if (!res.ok) {
      content.innerHTML = `
        <div class="payment-error">
          <p style="color: var(--color-error);">${data.error || 'Gagal membuat pembayaran'}</p>
          <button class="button button-secondary" onclick="closePaymentModal()">Tutup</button>
        </div>
      `;
      modal.style.display = 'flex';
      return;
    }

    // Start QRIS payment flow using service
    content.innerHTML = generateQRISPaymentHTML(data.invoice, data.payment.qrisUrl, data.payment.orderId);
    modal.style.display = 'flex';
    startPaymentTimer();
    
    // Auto-check payment status every 5 seconds
    window.paymentInterval = setInterval(() => {
      checkPaymentStatus(data.payment.orderId, true);
    }, 5000) as any;

  } catch (error) {
    console.error('Error creating payment:', error);
    content.innerHTML = '<p style="color: var(--color-error);">Terjadi kesalahan</p>';
    modal.style.display = 'flex';
  }
};

// Payment timer
const startPaymentTimer = (): void => {
  let seconds = 24 * 60 * 60; // 24 hours
  const timerEl = document.getElementById('paymentTimer');
  
  if (!timerEl) return;

  window.paymentTimerInterval = setInterval(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    seconds--;
    if (seconds < 0) {
      if (window.paymentTimerInterval) {
        clearInterval(window.paymentTimerInterval);
      }
      timerEl.textContent = 'Expired';
    }
  }, 1000) as any;
};

// Check payment status
const checkPaymentStatus = async (orderId: string, silent = false): Promise<void> => {
  try {
    const res = await fetch(`/api/webhooks/midtrans/check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId })
    });

    const data = await res.json();

    if (!silent && res.ok) {
      alert(`Status: ${data.status || 'Processing'}`);
    }

    if (res.ok && data.status === 'settlement') {
      // Payment successful
      if (window.paymentInterval) clearInterval(window.paymentInterval);
      if (window.paymentTimerInterval) clearInterval(window.paymentTimerInterval);
      closePaymentModal();
      loadInvoices();
      loadOverviewStats();
      alert('Pembayaran berhasil! Tagihan telah diperbarui.');
    }
  } catch (error) {
    if (!silent) {
      alert('Gagal mengecek status pembayaran');
    }
  }
};

// Close modals
const closePaymentModal = (): void => {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.style.display = 'none';
  
  // Clear intervals
  if (window.paymentInterval) {
    clearInterval(window.paymentInterval);
  }
  if (window.paymentTimerInterval) {
    clearInterval(window.paymentTimerInterval);
  }
};

const closeInvoiceModal = (): void => {
  const modal = document.getElementById('invoiceModal');
  if (modal) modal.style.display = 'none';
};

// Debounced load invoices to prevent excessive API calls
const debouncedLoadInvoices = debounce(loadInvoices, 300);

// Performance optimization: Use requestIdleCallback for non-critical tasks
const loadStats = (): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => fetchAndDisplayStats());
  } else {
    setTimeout(fetchAndDisplayStats, 0);
  }
};

async function fetchAndDisplayStats(): Promise<void> {
  try {
    const data = await fetchBillingStats();
    if (data && data.invoices) {
      const stats = calculateBillingStats(data.invoices);
      const statsContainer = document.getElementById('overviewStats');
      if (statsContainer) {
        statsContainer.innerHTML = generateStatsHTML(stats);
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Initialize using intersection observer for better performance
const initializeStatsObserver = (): void => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadStats();
        observer.disconnect();
      }
    });
  }, { threshold: 0.1 });

  const statsElement = document.getElementById('overviewStats');
  if (statsElement) observer.observe(statsElement);
};

// Main initialization
const initBillingDashboard = (): void => {
  // Add billing styles
  const style = document.createElement('style');
  style.textContent = getBillingStyles();
  document.head.appendChild(style);

  // Use event delegation instead of individual listeners
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    if (!target) return;
    
    if (target.id === 'statusFilter') {
      state.currentStatus = target.value;
      state.currentPage = 1;
      debouncedLoadInvoices();
    } else if (target.id === 'sortBy') {
      state.currentSort = target.value;
      state.currentPage = 1;
      debouncedLoadInvoices();
    }
  });

  // Initial load
  loadOverviewStats();
  loadInvoices();
  initializeStatsObserver();
};

// Export functions for global scope
(window as any).changePage = changePage;
(window as any).showInvoiceDetails = showInvoiceDetails;
(window as any).createPayment = createPayment;
(window as any).closeInvoiceModal = closeInvoiceModal;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBillingDashboard);
} else {
  initBillingDashboard();
}