/**
 * Project Service
 * Business logic for project status mapping and display
 * Extracted from inline JavaScript in dashboard/projects.astro
 * Enhanced with resilience patterns for production reliability
 */

import type { Project } from '../../lib/types';
import { ExternalServiceErrorCode } from '../../lib/resilience';

export interface ProjectStatus {
  label: string;
  variant: 'primary' | 'success' | 'warning' | 'default';
}

export class ProjectService {
  /**
   * Map project status to display information
   */
  static getStatusBadge(status: string): ProjectStatus {
    const statusMap: Record<string, ProjectStatus> = {
      pending_payment: { label: 'Menunggu Bayar', variant: 'warning' },
      in_progress: { label: 'Dalam Proses', variant: 'primary' },
      review: { label: 'Review', variant: 'default' },
      completed: { label: 'Selesai', variant: 'success' },
    };
    return statusMap[status] || { label: status, variant: 'default' };
  }

  /**
   * Generate project card HTML
   * Extracted from inline template string generation
   */
  static generateProjectCard(project: Project): string {
    const badge = this.getStatusBadge(project.status);
    const variantColor = this.getVariantColor(badge.variant);
    
    return `
      <div class="project-card">
        <div class="project-info">
          <div class="project-name">${project.name}</div>
          <div class="project-type">${project.type}</div>
          <div class="project-meta">
            <span>Dibuat: ${new Date(project.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
        <div class="project-actions">
          <span class="status-badge" style="background: ${variantColor}">${badge.label}</span>
          ${project.url ? `<a href="${project.url}" target="_blank" class="project-link">Kunjungi →</a>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get CSS color for status variant
   */
  private static getVariantColor(variant: string): string {
    const colorMap = {
      primary: 'var(--color-primary)',
      success: 'var(--color-success)',
      warning: 'var(--color-secondary)',
      default: 'var(--color-bg-tertiary)',
    };
    return colorMap[variant as keyof typeof colorMap] || colorMap.default;
  }

  /**
   * Load and render projects
   * Extracted from inline loadProjects function
   * Enhanced with resilience patterns for production reliability
   */
  static async loadProjects(): Promise<string> {
    try {
      const { withResilience } = await import('@/lib/resilience');

      const res = await withResilience(
        async () => {
          const response = await fetch('/api/client/projects', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          return response;
        },
        'ProjectService',
        'loadProjects',
        {
          timeout: { timeoutMs: 8000 },
          retry: {
            maxRetries: 2,
            initialDelayMs: 1000,
            retryableErrors: [
              ExternalServiceErrorCode.TIMEOUT,
              ExternalServiceErrorCode.NETWORK_ERROR,
              ExternalServiceErrorCode.SERVICE_UNAVAILABLE,
            ],
          },
          enableLogging: true,
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        return '<div class="empty-state">Gagal memuat proyek</div>';
      }

      if (data.data.length === 0) {
        return `
          <div class="empty-state">
            <p>Belum ada proyek. <a href="/layanan" style="color:var(--color-primary)">Pesan sekarang</a></p>
          </div>
        `;
      }

      return data.data.map((project: Project) => this.generateProjectCard(project)).join('');
    } catch (error) {
      console.error('[ProjectService] Failed to load projects:', error);
      return '<div class="empty-state">Terjadi kesalahan</div>';
    }
  }
}