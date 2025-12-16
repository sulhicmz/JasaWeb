import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import {
  CreateKbCategoryDto,
  UpdateKbCategoryDto,
  CreateKbTagDto,
  CreateKbArticleDto,
  UpdateKbArticleDto,
  CreateKbFeedbackDto,
  KbSearchDto,
  KbArticleStatus,
} from './dto/knowledge-base.dto';
import { User } from '@prisma/client';

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async createCategory(
    createCategoryDto: CreateKbCategoryDto,
    organizationId: string
  ) {
    return this.prisma.knowledgeBaseCategory.create({
      data: {
        ...createCategoryDto,
        organizationId,
      } as any,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async getCategories(organizationId?: string) {
    return this.prisma.knowledgeBaseCategory.findMany({
      where: organizationId ? ({ organizationId } as any) : undefined,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async getCategory(id: string, organizationId?: string) {
    const category = await this.prisma.knowledgeBaseCategory.findFirst({
      where: {
        id,
        ...(organizationId && { organizationId }),
      },
      include: {
        parent: true,
        children: true,
        articles: {
          where: {
            status: KbArticleStatus.PUBLISHED,
            ...(organizationId && { organizationId }),
          },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            tags: true,
            _count: {
              select: { feedback: true },
            },
          },
          orderBy: { featured: 'desc' },
        },
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateKbCategoryDto,
    organizationId: string
  ) {
    return this.prisma.knowledgeBaseCategory.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async deleteCategory(id: string, organizationId: string) {
    // Check if category exists and belongs to user's organization
    const category = await this.prisma.knowledgeBaseCategory.findFirst({
      where: { id, organizationId } as any,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has articles
    const articleCount = await this.prisma.kbArticle.count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing articles'
      );
    }

    return this.prisma.knowledgeBaseCategory.delete({
      where: { id },
    });
  }

  // Tags
  async createTag(createTagDto: CreateKbTagDto, organizationId: string) {
    return this.prisma.kbTag.create({
      data: {
        ...createTagDto,
        organizationId,
      } as any,
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async getTags(user?: User) {
    if (!user) {
      // Return tags for public view (no organization restriction)
      return this.prisma.kbTag.findMany({
        include: {
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    // Get user's organization from their membership
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });

    if (!membership) {
      return [];
    }

    return this.prisma.kbTag.findMany({
      where: { organizationId: membership.organizationId } as any,
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Articles
  async createArticle(createArticleDto: CreateKbArticleDto, author: User) {
    const { tagNames, ...articleData } = createArticleDto;

    // Get user's organization from their membership
    const membership = await this.prisma.membership.findFirst({
      where: { userId: author.id },
      select: { organizationId: true },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of any organization');
    }

    const organizationId = membership.organizationId;

    // Generate slug from title
    const slug = this.generateSlug(articleData.title);

    // Handle tags
    const tags = tagNames
      ? await this.getOrCreateTags(tagNames, organizationId)
      : [];

    const article = await this.prisma.kbArticle.create({
      data: {
        ...articleData,
        slug,
        organizationId,
        authorId: author.id,
        publishedAt:
          createArticleDto.status === KbArticleStatus.PUBLISHED
            ? new Date()
            : null,
        status: articleData.status || KbArticleStatus.DRAFT,
        searchVector: this.generateSearchVector(
          articleData.title,
          articleData.content,
          articleData.excerpt
        ),
        tags: {
          connect: tags.map((tag: { id: string }) => ({ id: tag.id })),
        },
      } as any,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
      },
    });

    return article;
  }

  async getArticles(
    status?: KbArticleStatus,
    categoryId?: string,
    featured?: boolean,
    user?: User
  ) {
    const where: Record<string, unknown> = {};

    // Only filter by organization if user is provided
    if (user) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: user.id },
        select: { organizationId: true },
      });

      if (membership) {
        where.organizationId = membership.organizationId;
      }
    }

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (featured !== undefined) where.featured = featured;

    return this.prisma.kbArticle.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
        _count: {
          select: { feedback: true },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getArticle(id: string, user?: User) {
    const where: Record<string, unknown> = { id };

    // Only filter by organization if user is provided
    if (user) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: user.id },
        select: { organizationId: true },
      });

      if (membership) {
        where.organizationId = membership.organizationId;
      }
    }

    const article = await this.prisma.kbArticle.findFirst({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
        feedback: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { feedback: true },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    await this.prisma.kbArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }

  async getArticleBySlug(slug: string, organizationId?: string) {
    const article = await this.prisma.kbArticle.findFirst({
      where: {
        slug,
        ...(organizationId && { organizationId }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
        feedback: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { feedback: true },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count - use compound unique key
    await this.prisma.kbArticle.update({
      where: {
        organizationId_slug: {
          organizationId: (article as any).organizationId,
          slug: article.slug,
        },
      } as any,
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateKbArticleDto,
    organizationId: string
  ) {
    const { tagNames, ...articleData } = updateArticleDto;

    // Check if article exists and belongs to user's organization
    const existingArticle = await this.prisma.kbArticle.findFirst({
      where: { id, organizationId } as any,
    });

    if (!existingArticle) {
      throw new NotFoundException('Article not found');
    }

    // Handle tags
    const tags = tagNames
      ? await this.getOrCreateTags(tagNames, organizationId)
      : undefined;

    // Update publishedAt if status changes to published
    const updateData: Record<string, unknown> = { ...articleData };
    if (articleData.status === KbArticleStatus.PUBLISHED) {
      if (!existingArticle?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    return this.prisma.kbArticle.update({
      where: { id },
      data: {
        ...updateData,
        searchVector: this.generateSearchVector(
          (updateData.title as string) || existingArticle.title || '',
          (updateData.content as string) || existingArticle.content || '',
          (updateData.excerpt as string) || existingArticle.excerpt || ''
        ),
        ...(tags && {
          tags: {
            set: tags.map((tag: { id: string }) => ({ id: tag.id })),
          },
        }),
      } as any,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
      },
    });
  }

  async deleteArticle(id: string, organizationId: string) {
    // Check if article exists and belongs to user's organization
    const article = await this.prisma.kbArticle.findFirst({
      where: { id, organizationId } as any,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.kbArticle.delete({
      where: { id },
    });
  }

  // Search
  async search(searchDto: KbSearchDto, organizationId?: string) {
    const {
      query,
      categoryId,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      excludeTags,
      dateRange,
      includeUnpublished = false,
      authorId,
    } = searchDto;
    const skip = (page - 1) * limit;

    // Log search - only if organizationId is provided
    if (organizationId) {
      await this.prisma.kbSearchLog.create({
        data: {
          query,
          organizationId, // Required field
          ipAddress: 'localhost', // Would be extracted from request context in real implementation
          userAgent: 'JasaWeb-API', // Would be extracted from request headers in real implementation
        } as any,
      });
    }

    // Build search conditions for full-text search
    const searchConditions: Record<string, unknown> = {
      ...(organizationId && { organizationId }),
    };

    // Only filter by published status if not explicitly including unpublished
    if (!includeUnpublished) {
      searchConditions.status = KbArticleStatus.PUBLISHED;
    }

    if (categoryId) {
      searchConditions.categoryId = categoryId;
    }

    if (tags && tags.length > 0) {
      searchConditions.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      };
    }

    if (excludeTags && excludeTags.length > 0) {
      if (
        searchConditions.tags &&
        typeof searchConditions.tags === 'object' &&
        'some' in searchConditions.tags
      ) {
        // Combine with existing tags condition
        searchConditions.tags = {
          some: (searchConditions.tags as any).some,
          none: {
            tag: {
              name: {
                in: excludeTags,
              },
            },
          },
        };
      } else {
        // Only exclude tags
        searchConditions.tags = {
          none: {
            tag: {
              name: {
                in: excludeTags,
              },
            },
          },
        };
      }
    }

    if (authorId) {
      searchConditions.authorId = authorId;
    }

    // Add date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter': {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        }
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      searchConditions.publishedAt = {
        gte: startDate,
      };
    }

    // Use raw query for better full-text search performance with advanced sorting
    const searchQuery = this.buildAdvancedSearchQuery(
      query,
      searchConditions,
      sortBy
    );

    // Update limit and offset in the query parameters
    const paramLength = searchQuery.params.length;
    searchQuery.params[paramLength - 2] = limit;
    searchQuery.params[paramLength - 1] = skip;

    const [articles, total] = await Promise.all([
      this.prisma.$queryRawUnsafe(searchQuery.query, ...searchQuery.params),
      this.prisma.kbArticle.count({
        where: searchConditions,
      }),
    ]);

    // Update search log with results count
    if (organizationId) {
      await this.prisma.kbSearchLog.updateMany({
        where: {
          query,
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 1000), // Last second
          },
        },
        data: {
          results: total,
        },
      });
    }

    // Format results
    const formattedArticles = await Promise.all(
      (articles as any[]).map(async (article) => {
        const fullArticle = await this.prisma.kbArticle.findUnique({
          where: { id: article.id },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            category: true,
            tags: true,
          },
        });

        return {
          ...fullArticle,
          rank: article.rank,
          _count: {
            feedback: parseInt(article.feedback_count) || 0,
          },
        };
      })
    );

    return {
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private buildAdvancedSearchQuery(
    query: string,
    conditions: Record<string, unknown>,
    sortBy: string
  ) {
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Add organization condition if present
    if (conditions.organizationId) {
      whereConditions.push(`a.organization_id = $${paramIndex++}`);
      params.push(conditions.organizationId);
    }

    // Add status condition if present
    if (conditions.status) {
      whereConditions.push(`a.status = $${paramIndex++}`);
      params.push(conditions.status);
    }

    // Add full-text search condition
    whereConditions.push(
      `a.search_vector @@ plainto_tsquery('english', $${paramIndex++})`
    );
    params.push(query);

    // Add category condition if present
    if (conditions.categoryId) {
      whereConditions.push(`a.category_id = $${paramIndex++}`);
      params.push(conditions.categoryId);
    }

    // Add author condition if present
    if (conditions.authorId) {
      whereConditions.push(`a.author_id = $${paramIndex++}`);
      params.push(conditions.authorId);
    }

    // Add date range condition if present
    if (
      conditions.publishedAt &&
      typeof conditions.publishedAt === 'object' &&
      'gte' in conditions.publishedAt
    ) {
      whereConditions.push(`a.published_at >= $${paramIndex++}`);
      params.push(conditions.publishedAt.gte);
    }

    // Build ORDER BY clause based on sortBy
    let orderByClause = '';
    switch (sortBy) {
      case 'title':
        orderByClause = 'ORDER BY a.title ASC, a.featured DESC';
        break;
      case 'newest':
        orderByClause =
          'ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC, a.featured DESC';
        break;
      case 'oldest':
        orderByClause =
          'ORDER BY a.published_at ASC NULLS LAST, a.created_at ASC, a.featured DESC';
        break;
      case 'views':
        orderByClause =
          'ORDER BY a.view_count DESC, a.featured DESC, a.published_at DESC';
        break;
      case 'relevance':
      default:
        orderByClause =
          "ORDER BY ts_rank(a.search_vector, plainto_tsquery('english', $1)) DESC, a.featured DESC, a.published_at DESC";
        break;
    }

    // Complete query as string template
    const fullQuery = `
      SELECT 
        a.*,
        ts_rank(a.search_vector, plainto_tsquery('english', $1)) as rank,
        (SELECT COUNT(*) FROM "kb_feedback" WHERE "article_id" = a.id) as feedback_count
      FROM "kb_article" a
      WHERE ${whereConditions.join(' AND ')}
      ${orderByClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    // Add limit and offset to params
    params.push(10, 0); // Default values, will be overridden by the calling method

    return {
      query: fullQuery,
      params,
    };
  }

  // Advanced Search Features
  async getSearchSuggestions(query: string, organizationId?: string) {
    if (!query || query.length < 2) {
      return { suggestions: [], articles: [] };
    }

    // Get article title suggestions
    const titleSuggestions = await this.prisma.kbArticle.findMany({
      where: {
        ...(organizationId && { organizationId }),
        status: KbArticleStatus.PUBLISHED,
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    });

    // Get related tags
    const tagSuggestions = await this.prisma.kbTag.findMany({
      where: {
        ...(organizationId && { organizationId }),
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        color: true,
      },
      take: 3,
    });

    return {
      suggestions: titleSuggestions.map((article) => ({
        type: 'article',
        title: article.title,
        url: `/knowledge-base/article/${article.slug}`,
        category: article.category.name,
      })),
      tags: tagSuggestions,
      articles: titleSuggestions,
    };
  }

  async getPopularSearches(organizationId?: string) {
    const popularSearches = await this.prisma.kbSearchLog.groupBy({
      by: ['query'],
      where: {
        ...(organizationId && { organizationId }),
        results: {
          gt: 0, // Only include searches that returned results
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: 10,
    });

    // Get trending articles (most viewed in last 7 days)
    const trendingArticles = await this.prisma.kbArticle.findMany({
      where: {
        ...(organizationId && { organizationId }),
        status: KbArticleStatus.PUBLISHED,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    return {
      popularSearches: popularSearches.map((item) => ({
        query: item.query,
        count: item._count.query,
      })),
      trendingArticles,
    };
  }

  // Feedback
  async createFeedback(
    articleId: string,
    createFeedbackDto: CreateKbFeedbackDto,
    user?: User
  ) {
    // Check if article exists
    const article = await this.prisma.kbArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.prisma.kbFeedback.create({
      data: {
        ...createFeedbackDto,
        articleId,
        userId: user?.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Analytics
  async getAnalytics(organizationId: string) {
    const [
      totalArticles,
      publishedArticles,
      totalCategories,
      totalTags,
      totalViews,
      recentSearches,
      popularArticles,
    ] = await Promise.all([
      this.prisma.kbArticle.count({
        where: { organizationId } as any,
      }),
      this.prisma.kbArticle.count({
        where: {
          organizationId,
          status: KbArticleStatus.PUBLISHED,
        } as any,
      }),
      this.prisma.knowledgeBaseCategory.count({
        where: { organizationId } as any,
      }),
      this.prisma.kbTag.count({
        where: { organizationId } as any,
      }),
      this.prisma.kbArticle.aggregate({
        _sum: { viewCount: true },
        where: { organizationId } as any,
      }),
      this.prisma.kbSearchLog.findMany({
        where: { organizationId } as any,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { query: true, results: true, createdAt: true },
      }),
      this.prisma.kbArticle.findMany({
        where: {
          organizationId,
          status: KbArticleStatus.PUBLISHED,
        } as any,
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, title: true, slug: true, viewCount: true },
      }),
    ]);

    return {
      totalArticles,
      publishedArticles,
      totalCategories,
      totalTags,
      totalViews: totalViews._sum?.viewCount || 0,
      recentSearches,
      popularArticles,
    };
  }

  // Helper methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async getOrCreateTags(tagNames: string[], organizationId: string) {
    const tags = await this.prisma.kbTag.findMany({
      where: {
        organizationId,
        name: {
          in: tagNames,
        },
      } as any,
    });

    const existingTagNames = tags.map((tag: { name: string }) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name)
    );

    if (newTagNames.length > 0) {
      const newTags = await Promise.all(
        newTagNames.map((name) =>
          this.prisma.kbTag.create({
            data: { name, organizationId } as any,
          })
        )
      );
      tags.push(...newTags);
    }

    return tags;
  }

  private generateSearchVector(
    title: string,
    content: string,
    excerpt?: string
  ): string {
    // Combine title, content, and excerpt for full-text search
    const searchText = [title, content, excerpt].filter(Boolean).join(' ');

    // This would typically use PostgreSQL's to_tsvector function
    // For now, we'll store the raw text and let the database handle it
    return searchText;
  }
}
