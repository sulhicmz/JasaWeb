/**
 * Template Service
 * Business logic for template filtering and display
 * Database-driven template management
 */
import type { TemplateCategory } from '../../lib/config';
import { templateCategories } from '../../lib/config';

export interface Template {
  id: string;
  name: string;
  category: 'sekolah' | 'berita' | 'company';
  imageUrl: string;
  demoUrl: string;
  createdAt: Date;
}

export interface TemplateListResponse {
  templates: Template[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class TemplateService {
  /**
   * Get all template categories
   */
  static getCategories() {
    return templateCategories;
  }

  /**
   * Fetch templates from API with filtering
   */
  static async fetchTemplates(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`/api/templates?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Filter templates by category
   */
  static filterByCategory(templates: Template[], category: TemplateCategory): Template[] {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
  }

  /**
   * Create template data
   */
  static async createTemplate(data: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
    const response = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update template data
   */
  static async updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
    const response = await fetch(`/api/admin/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update template: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`/api/admin/templates/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }
  }

  /**
   * Generate client-side filtering script
   * Returns sanitized JavaScript code for category filtering
   */
  static generateFilterScript(): string {
    return `
      const filterBtns = document.querySelectorAll('.filter-btn');
      const cards = document.querySelectorAll('.template-card');

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const category = btn.dataset.category;
          
          cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
              card.classList.remove('hidden');
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    `;
  }
}