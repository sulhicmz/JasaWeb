const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/knowledge-base${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Categories
  async getCategories(): Promise<KbCategory[]> {
    return this.request<KbCategory[]>('/categories');
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
  }): Promise<KbArticle[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.categoryId)
      searchParams.append('categoryId', params.categoryId);
    if (params?.featured !== undefined)
      searchParams.append('featured', params.featured.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());

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
}

export const knowledgeBaseService = new KnowledgeBaseService();
