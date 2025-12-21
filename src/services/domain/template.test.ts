/**
 * Template System Tests
 * Tests database-driven template functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService, type Template } from './template';

// Mock fetch
global.fetch = vi.fn();

describe('TemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return template categories', () => {
      const categories = TemplateService.getCategories();
      
      expect(categories).toHaveLength(4);
      expect(categories[0]).toEqual({
        value: 'all',
        label: 'Semua'
      });
      expect(categories[1]).toEqual({
        value: 'sekolah',
        label: 'Web Sekolah'
      });
    });
  });

  describe('fetchTemplates', () => {
    it('should fetch templates without parameters', async () => {
      const mockResponse = {
        templates: [
          {
            id: '1',
            name: 'EduPrime',
            category: 'sekolah',
            imageUrl: '/templates/eduprime.jpg',
            demoUrl: '#',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await TemplateService.fetchTemplates();

      expect(fetch).toHaveBeenCalledWith('/api/templates?');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch templates with parameters', async () => {
      const mockResponse = {
        templates: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await TemplateService.fetchTemplates({
        page: 1,
        limit: 10,
        category: 'sekolah',
        search: 'edu',
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/templates?page=1&limit=10&category=sekolah&search=edu&sortBy=name&sortOrder=asc'
      );
    });

    it('should handle fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      await expect(TemplateService.fetchTemplates()).rejects.toThrow('Failed to fetch templates: Not Found');
    });
  });

  describe('filterByCategory', () => {
    const mockTemplates: Template[] = [
      { 
        id: '1', 
        category: 'sekolah', 
        name: 'EduPrime',
        imageUrl: '/test1.jpg',
        demoUrl: '#',
        createdAt: new Date('2024-01-01T00:00:00.000Z')
      },
      { 
        id: '2', 
        category: 'berita', 
        name: 'NewsFlow',
        imageUrl: '/test2.jpg',
        demoUrl: '#',
        createdAt: new Date('2024-01-01T00:00:00.000Z')
      },
      { 
        id: '3', 
        category: 'sekolah', 
        name: 'SchoolHub',
        imageUrl: '/test3.jpg',
        demoUrl: '#',
        createdAt: new Date('2024-01-01T00:00:00.000Z')
      }
    ];

    it('should return all templates for "all" category', () => {
      const filtered = TemplateService.filterByCategory(mockTemplates, 'all');
      expect(filtered).toHaveLength(3);
    });

    it('should filter templates by category', () => {
      const filtered = TemplateService.filterByCategory(mockTemplates, 'sekolah');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.category === 'sekolah')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const filtered = TemplateService.filterByCategory(mockTemplates, 'company');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const newTemplate = {
        name: 'Test Template',
        category: 'sekolah' as const,
        imageUrl: '/test.jpg',
        demoUrl: 'https://demo.test.com'
      };

      const createdTemplate = {
        id: 'new-id',
        ...newTemplate,
        createdAt: new Date().toISOString()
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => createdTemplate
      } as Response);

      const result = await TemplateService.createTemplate(newTemplate);

      expect(fetch).toHaveBeenCalledWith('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate)
      });
      expect(result).toEqual(createdTemplate);
    });

    it('should handle creation errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      } as Response);

      await expect(TemplateService.createTemplate({
        name: 'Test',
        category: 'sekolah',
        imageUrl: '/test.jpg',
        demoUrl: '#'
      })).rejects.toThrow('Failed to create template: Unauthorized');
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const updateData = {
        name: 'Updated Template Name'
      };

      const updatedTemplate = {
        id: '1',
        name: 'Updated Template Name',
        category: 'sekolah',
        imageUrl: '/templates/eduprime.jpg',
        demoUrl: '#',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTemplate
      } as Response);

      const result = await TemplateService.updateTemplate('1', updateData);

      expect(fetch).toHaveBeenCalledWith('/api/admin/templates/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      expect(result).toEqual(updatedTemplate);
    });

    it('should handle update errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      await expect(TemplateService.updateTemplate('1', { name: 'Updated' }))
        .rejects.toThrow('Failed to update template: Not Found');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true
      } as Response);

      await TemplateService.deleteTemplate('1');

      expect(fetch).toHaveBeenCalledWith('/api/admin/templates/1', {
        method: 'DELETE'
      });
    });

    it('should handle deletion errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      await expect(TemplateService.deleteTemplate('1'))
        .rejects.toThrow('Failed to delete template: Not Found');
    });
  });

  describe('generateFilterScript', () => {
    it('should generate JavaScript filter script', () => {
      const script = TemplateService.generateFilterScript();
      
      expect(script).toContain('filterBtns');
      expect(script).toContain('cards');
      expect(script).toContain('addEventListener');
      expect(script).toContain('dataset.category');
    });
  });
});