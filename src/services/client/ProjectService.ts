/**
 * Client Project Service
 * Business logic for project operations and display
 */

import type { Project } from '@/lib/types';

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
 * Project Service - Centralized project business logic
 */
export class ProjectService {
  
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

  /**
   * Get projects with display transformation
   */
  static getProjectsWithDisplay(projects: Project[]): ProjectDisplayData[] {
    return projects.map(project => this.transformProjectForDisplay(project));
  }
}