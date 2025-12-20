/**
 * Invoice Service
 * Business logic for invoice operations and statistics
 */

import type { Invoice } from '@/lib/types';

export interface InvoiceStats {
  total: number;
  totalAmount: number;
  unpaid: number;
  unpaidAmount: number;
  paid: number;
  paidAmount: number;
}

/**
 * Invoice Service - Centralized invoice business logic
 */
export class InvoiceService {
  
  /**
   * Calculate invoice statistics from invoice array
   */
  static calculateInvoiceStats(invoices: Invoice[]): InvoiceStats {
    const total = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    
    const unpaid = invoices.filter(inv => inv.status === 'unpaid');
    const paid = invoices.filter(inv => inv.status === 'paid');
    
    const unpaidAmount = unpaid.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const paidAmount = paid.reduce((sum, inv) => sum + Number(inv.amount), 0);

    return {
      total,
      totalAmount,
      unpaid: unpaid.length,
      unpaidAmount,
      paid: paid.length,
      paidAmount
    };
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }

  /**
   * Generate HTML for invoice statistics cards
   * @deprecated - Use component-based rendering instead
   */
  static generateInvoiceStatsHTML(stats: InvoiceStats): string {
    return `
      <div class="stat-card">
        <div class="stat-label">Total Tagihan</div>
        <div class="stat-value">${this.formatCurrency(stats.totalAmount)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Belum Dibayar</div>
        <div class="stat-value">${this.formatCurrency(stats.unpaidAmount)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sudah Dibayar</div>
        <div class="stat-value">${this.formatCurrency(stats.paidAmount)}</div>
      </div>
    `;
  }
}