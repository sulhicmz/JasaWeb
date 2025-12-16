import { describe, it, expect, beforeEach, vi } from 'vitest';
import { knowledgeBaseService } from '../../../src/services/knowledgeBaseService';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock environment variable
const originalEnv = import.meta.env;
vi.mock('../../../src/env', () => ({
  env: {
    PUBLIC_API_BASE_URL: 'http://localhost:3001',
  },
}));

describe('knowledgeBaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Getting Started', _count: { articles: 5 } },
        { id: '2', name: 'Advanced Features', _count: { articles: 3 } },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const result = await knowledgeBaseService.getCategories();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/categories',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockCategories);
    });

    it('should include authorization header when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await knowledgeBaseService.getCategories();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/categories',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(knowledgeBaseService.getCategories()).rejects.toThrow(
        'Not found'
      );
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(knowledgeBaseService.getCategories()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getArticles', () => {
    it('should fetch articles with parameters', async () => {
      const mockArticles = [
        { id: '1', title: 'Test Article', status: 'published' },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticles,
      });

      const result = await knowledgeBaseService.getArticles({
        status: 'published',
        categoryId: 'cat1',
        featured: true,
        limit: 10,
        page: 1,
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/articles?status=published&categoryId=cat1&featured=true&limit=10&page=1',
        expect.any(Object)
      );
      expect(result).toEqual(mockArticles);
    });

    it('should fetch articles without parameters', async () => {
      const mockArticles = [];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticles,
      });

      await knowledgeBaseService.getArticles();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/articles',
        expect.any(Object)
      );
    });
  });

  describe('getArticleBySlug', () => {
    it('should fetch article by slug', async () => {
      const mockArticle = {
        id: '1',
        slug: 'test-article',
        title: 'Test Article',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticle,
      });

      const result =
        await knowledgeBaseService.getArticleBySlug('test-article');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/articles/slug/test-article',
        expect.any(Object)
      );
      expect(result).toEqual(mockArticle);
    });
  });

  describe('searchArticles', () => {
    it('should search articles with query', async () => {
      const mockSearchResult = {
        articles: [{ id: '1', title: 'Search Result Article' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const searchParams = {
        query: 'test search',
        categoryId: 'cat1',
        tags: ['tag1', 'tag2'],
        page: 1,
        limit: 10,
      };

      const result = await knowledgeBaseService.searchArticles(searchParams);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(searchParams),
        })
      );
      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('createFeedback', () => {
    it('should create feedback for article', async () => {
      const mockFeedback = {
        id: 'feedback1',
        rating: 5,
        comment: 'Great article!',
        helpful: true,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback,
      });

      const feedbackData = {
        rating: 5,
        comment: 'Great article!',
        helpful: true,
      };

      const result = await knowledgeBaseService.createFeedback(
        'article1',
        feedbackData
      );

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/articles/article1/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(feedbackData),
        })
      );
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('getAnalytics', () => {
    it('should fetch analytics data', async () => {
      const mockAnalytics = {
        totalArticles: 10,
        publishedArticles: 8,
        totalCategories: 5,
        totalTags: 15,
        totalViews: 100,
        recentSearches: [],
        popularArticles: [],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      });

      const result = await knowledgeBaseService.getAnalytics();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/analytics',
        expect.any(Object)
      );
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('error handling', () => {
    it('should throw error when API_BASE_URL is not defined', async () => {
      // Temporarily unset the environment variable
      const originalApiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL;
      delete (import.meta.env as any).PUBLIC_API_BASE_URL;

      await expect(knowledgeBaseService.getCategories()).rejects.toThrow(
        'API_BASE_URL environment variable is required'
      );

      // Restore the environment variable
      (import.meta.env as any).PUBLIC_API_BASE_URL = originalApiBaseUrl;
    });

    it('should handle JSON parse errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(knowledgeBaseService.getCategories()).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle empty error response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('No response body')),
      });

      await expect(knowledgeBaseService.getCategories()).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });
  });

  describe('authentication headers', () => {
    it('should not include authorization header when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await knowledgeBaseService.getCategories();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/categories',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should include custom headers alongside default headers', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Call searchArticles to test custom headers
      await knowledgeBaseService.searchArticles({ query: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/knowledge-base/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
