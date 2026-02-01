/**
 * Projects Page Client Script
 * Handles project loading and display using existing ProjectService
 */

import { ProjectService } from '@/services/domain/ProjectService';
import type { Project } from '@/lib/types';

declare global {
  interface Window {
    projectsPage?: ProjectsPageHandler;
  }
}

/**
 * Projects page client handler
 */
export class ProjectsPageHandler {
  private container: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('projectsList');
    this.init();
  }

  /**
   * Initialize page functionality
   */
  private init(): void {
    // Load projects on page load
    this.loadProjects();
  }

  /**
   * Load and display projects
   */
  private async loadProjects(): Promise<void> {
    if (!this.container) return;

    try {
      const res = await fetch('/api/client/projects');
      const data = await res.json();

      if (!res.ok || !data.success) {
        this.container.innerHTML = '<div class="empty-state"><p>Gagal memuat proyek</p></div>';
        return;
      }

      // Use existing service for data transformation
      const projects = data.data;
      const displayProjects = projects.map((p: Project) => ProjectService.transformProjectForDisplay(p));
      
      // Generate HTML using transformed data
      const projectsHTML = this.generateProjectCardsHTML(displayProjects);
      this.container.innerHTML = projectsHTML;
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.container.innerHTML = '<div class="empty-state"><p>Terjadi kesalahan</p></div>';
    }
  }

  /**
   * Generate HTML for project cards using display data
   */
  private generateProjectCardsHTML(projects: Array<{id: string; name: string; type: string; status: string; statusLabel: string; createdAt: string; url?: string}>): string {
    if (projects.length === 0) {
      return '<div class="empty-state"><p>Belum ada proyek. <a href="/layanan" style="color:var(--color-primary)">Pesan sekarang</a></p></div>';
    }

    return projects.map(project => `
      <div class="project-card">
        <div class="project-info">
          <div class="project-name">${project.name}</div>
          <div class="project-type">${project.type}</div>
          <div class="project-meta">
            <span>Dibuat: ${project.createdAt}</span>
          </div>
        </div>
        <div class="project-actions">
          <span class="status-badge status-${project.status}">${project.statusLabel}</span>
          ${project.url ? `<a href="${project.url}" target="_blank" class="project-link">Kunjungi →</a>` : ''}
        </div>
      </div>
    `).join('');
  }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.projectsPage = new ProjectsPageHandler();
  });
}