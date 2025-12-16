import { config } from '../config';

const API_BASE_URL = config.api.baseUrl;

export interface KbCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  parentId?: string;
  parent?: KbCategory;
  children?: KbCategory[];
  articles?: KbArticle[];
  _count?: {
    articles: number;
  };
}

export interface KbTag {
  id: string;
  name: string;
  color?: string;
  _count?: {
    articles: number;
  };
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  viewCount: number;
  categoryId: string;
  category: KbCategory;
  author: {
    id: string;
    name: string;
    email: string;
  };
  tags: KbTag[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  _count?: {
    feedback: number;
  };
}

export interface KbFeedback {
  id: string;
  rating: number;
  comment?: string;
  helpful?: boolean;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface KbSearchResult {
  articles: KbArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface KbAnalytics {
  totalArticles: number;
  publishedArticles: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
  recentSearches: Array<{
    query: string;
    results: number;
    createdAt: string;
  }>;
  popularArticles: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
  }>;
}

class KnowledgeBaseService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${config.api.baseUrl}${config.api.knowledgeBaseEndpoint}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Categories
  async getCategories(organizationId?: string): Promise<KbCategory[]> {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request<KbCategory[]>(`/categories${query}`);
  }

  async getCategory(id: string): Promise<KbCategory> {
    return this.request<KbCategory>(`/categories/${id}`);
  }

  // Tags
  async getTags(): Promise<KbTag[]> {
    return this.request<KbTag[]>('/tags');
  }

  // Articles
  async getArticles(params?: {
    status?: 'draft' | 'published' | 'archived';
    categoryId?: string;
    featured?: boolean;
    limit?: number;
    page?: number;
    organizationId?: string;
  }): Promise<KbArticle[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.categoryId)
      searchParams.append('categoryId', params.categoryId);
    if (params?.featured !== undefined)
      searchParams.append('featured', params.featured.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.organizationId)
      searchParams.append('organizationId', params.organizationId);

    const query = searchParams.toString();
    return this.request<KbArticle[]>(`/articles${query ? `?${query}` : ''}`);
  }

  async getArticle(id: string): Promise<KbArticle> {
    return this.request<KbArticle>(`/articles/${id}`);
  }

  async getArticleBySlug(slug: string): Promise<KbArticle> {
    return this.request<KbArticle>(`/articles/slug/${slug}`);
  }

  async searchArticles(params: {
    query: string;
    categoryId?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<KbSearchResult> {
    return this.request<KbSearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async createFeedback(
    articleId: string,
    feedback: {
      rating: number;
      comment?: string;
      helpful?: boolean;
    }
  ): Promise<KbFeedback> {
    return this.request<KbFeedback>(`/articles/${articleId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getAnalytics(): Promise<KbAnalytics> {
    return this.request<KbAnalytics>('/analytics');
  }

  async getSearchSuggestions(query: string): Promise<{
    suggestions: Array<{
      type: string;
      title: string;
      url: string;
      category: string;
    }>;
    tags: Array<{
      name: string;
      color?: string;
    }>;
    articles: KbArticle[];
  }> {
    return this.request<any>(
      `/search/suggestions?q=${encodeURIComponent(query)}`
    );
  }

  async getPopularSearches(organizationId?: string): Promise<{
    popularSearches: Array<{
      query: string;
      count: number;
    }>;
    trendingArticles: KbArticle[];
  }> {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request<any>(`/search/popular${query}`);
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
