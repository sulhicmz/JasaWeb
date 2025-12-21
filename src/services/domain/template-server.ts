/**
 * Template Server Service
 * Server-side template management service
 * Uses direct database access for server-side rendering
 */
import type { TemplateCategory } from '../../lib/config';
import { templateCategories, getCategoryLabel, type ServiceId } from '../../lib/config';
import { createPrismaQuery, addSearchCondition, type PaginationParams } from '../shared/pagination';
import type { PrismaClient } from '@prisma/client';

export interface ServerTemplate {
  id: string;
  name: string;
  category: 'sekolah' | 'berita' | 'company';
  imageUrl: string;
  demoUrl: string;
  createdAt: Date;
}

export interface ServerTemplateListResponse {
  templates: ServerTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class TemplateServerService {
  /**
   * Get all template categories
   */
  static getCategories() {
    return templateCategories;
  }

  /**
   * Get category label
   */
  static getCategoryLabel(category: ServiceId): string {
    return getCategoryLabel(category);
  }

  /**
   * Fetch templates for server-side rendering
   */
  static async fetchTemplates(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    prisma: PrismaClient;
  }): Promise<ServerTemplateListResponse> {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      prisma
    } = params;

    // Validate category if provided  
    const categoryFilter = category;
    if (categoryFilter && !['sekolah', 'berita', 'company'].includes(categoryFilter)) {
      throw new Error('Kategori harus "sekolah", "berita", atau "company"');
    }

    // Build where clause with search and filters
    let where: Record<string, any> = {};
    
    if (categoryFilter) {
      where.category = categoryFilter;
    }
    
    if (search) {
      where = addSearchCondition(where, search, ['name', 'category']);
    }

    // Create pagination parameters
    const pagination: PaginationParams = {
      page,
      limit,
      skip: (page - 1) * limit
    };
    const sort = { sortBy, sortOrder };

    // Create Prisma query with pagination
    const prismaQuery = createPrismaQuery(pagination, sort, where);

    // Get total count and templates in parallel
    const [total, templates] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.findMany({
        ...prismaQuery,
        select: {
          id: true,
          name: true,
          category: true,
          imageUrl: true,
          demoUrl: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Filter templates by category (client-side utility)
   */
  static filterByCategory(templates: ServerTemplate[], category: TemplateCategory): ServerTemplate[] {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
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