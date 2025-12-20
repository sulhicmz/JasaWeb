/**
 * Client Dashboard Service
 * Centralized business logic for client portal dashboard operations
 */

import type { Project, Invoice } from '@/lib/types';

export interface DashboardStats {
  totalProjects: number;
  inProgress: number;
  completed: number;
  unpaidInvoices: number;
}

export interface InvoiceStats {
  total: number;
  totalAmount: number;
  unpaid: number;
  unpaidAmount: number;
  paid: number;
  paidAmount: number;
}

export interface ProjectDisplayData {
  id: string;
  name: string;
  type: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  url?: string;
}

/**
 * Dashboard Service - Centralized client dashboard business logic
 */
export class DashboardService {
  
  /**
   * Calculate dashboard statistics from projects and invoices
   */
  static calculateDashboardStats(projects: Project[], invoices: Invoice[]): DashboardStats {
    return {
      totalProjects: projects.length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      unpaidInvoices: invoices.filter(inv => inv.status === 'unpaid').length
    };
  }

  /**
   * Calculate invoice statistics
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
   * Transform project data for display
   */
  static transformProjectForDisplay(project: Project): ProjectDisplayData {
    return {
      id: project.id,
      name: project.name,
      type: project.type,
      status: project.status,
      statusLabel: this.getProjectStatusLabel(project.status),
      createdAt: new Date(project.createdAt).toLocaleDateString('id-ID'),
      url: project.url || undefined
    };
  }

  /**
   * Get human-readable status label
   */
  static getProjectStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_payment: 'Menunggu Bayar',
      in_progress: 'Dalam Proses',
      review: 'Review',
      completed: 'Selesai'
    };
    return labels[status] || status;
  }

  /**
   * Generate HTML for invoice statistics cards
   * @deprecated - Use component-based rendering instead
   */
  static generateInvoiceStatsHTML(stats: InvoiceStats): string {
    return `
      <div class="stat-card">
        <div class="stat-label">Total Tagihan</div>
        <div class="stat-value">Rp ${stats.totalAmount.toLocaleString('id-ID')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Belum Dibayar</div>
        <div class="stat-value">Rp ${stats.unpaidAmount.toLocaleString('id-ID')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sudah Dibayar</div>
        <div class="stat-value">Rp ${stats.paidAmount.toLocaleString('id-ID')}</div>
      </div>
    `;
  }

  /**
   * Generate HTML for project cards
   * @deprecated - Use component-based rendering instead
   */
  static generateProjectCardsHTML(projects: Project[]): string {
    if (projects.length === 0) {
      return '<div class="empty-state"><p>Belum ada proyek. <a href="/layanan" style="color:var(--color-primary)">Pesan sekarang</a></p></div>';
    }

    return projects.map(project => {
      const displayData = this.transformProjectForDisplay(project);
      return `
        <div class="project-card">
          <div class="project-info">
            <div class="project-name">${displayData.name}</div>
            <div class="project-type">${displayData.type}</div>
            <div class="project-meta">
              <span>Dibuat: ${displayData.createdAt}</span>
            </div>
          </div>
          <div class="project-actions">
            <span class="status-badge status-${displayData.status}">${displayData.statusLabel}</span>
            ${displayData.url ? `<a href="${displayData.url}" target="_blank" class="project-link">Kunjungi →</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}