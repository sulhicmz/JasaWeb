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
  async createCategory(createCategoryDto: CreateKbCategoryDto) {
    return this.prisma.knowledgeBaseCategory.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async getCategories() {
    return this.prisma.knowledgeBaseCategory.findMany({
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

  async getCategory(id: string) {
    const category = await this.prisma.knowledgeBaseCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        articles: {
          where: { status: KbArticleStatus.PUBLISHED },
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

  async updateCategory(id: string, updateCategoryDto: UpdateKbCategoryDto) {
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

  async deleteCategory(id: string) {
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
  async createTag(createTagDto: CreateKbTagDto) {
    return this.prisma.kbTag.create({
      data: createTagDto,
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async getTags() {
    return this.prisma.kbTag.findMany({
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

    // Generate slug from title
    const slug = this.generateSlug(articleData.title);

    // Handle tags
    const tags = tagNames ? await this.getOrCreateTags(tagNames) : [];

    const article = await this.prisma.kbArticle.create({
      data: {
        ...articleData,
        slug,
        authorId: author.id,
        publishedAt:
          createArticleDto.status === KbArticleStatus.PUBLISHED
            ? new Date()
            : null,
        status: articleData.status || KbArticleStatus.DRAFT,
        tags: {
          connect: tags.map((tag: any) => ({ id: tag.id })),
        },
      },
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
    featured?: boolean
  ) {
    const where: any = {};

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

  async getArticle(id: string) {
    const article = await this.prisma.kbArticle.findUnique({
      where: { id },
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

  async getArticleBySlug(slug: string) {
    const article = await this.prisma.kbArticle.findUnique({
      where: { slug },
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
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }

  async updateArticle(id: string, updateArticleDto: UpdateKbArticleDto) {
    const { tagNames, ...articleData } = updateArticleDto;

    // Handle tags
    const tags = tagNames ? await this.getOrCreateTags(tagNames) : undefined;

    // Update publishedAt if status changes to published
    const updateData: any = { ...articleData };
    if (articleData.status === KbArticleStatus.PUBLISHED) {
      const currentArticle = await this.prisma.kbArticle.findUnique({
        where: { id },
      });
      if (!currentArticle?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    return this.prisma.kbArticle.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags && {
          tags: {
            set: tags.map((tag: any) => ({ id: tag.id })),
          },
        }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: true,
        tags: true,
      },
    });
  }

  async deleteArticle(id: string) {
    return this.prisma.kbArticle.delete({
      where: { id },
    });
  }

  // Search
  async search(searchDto: KbSearchDto, user?: User) {
    const { query, categoryId, tags, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    // Log search
    await this.prisma.kbSearchLog.create({
      data: {
        query,
        userId: user?.id,
        ipAddress: '127.0.0.1', // Would get from request in real implementation
        userAgent: 'Mozilla/5.0', // Would get from request in real implementation
      },
    });

    // Build search conditions
    const where: any = {
      status: KbArticleStatus.PUBLISHED,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.kbArticle.findMany({
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
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.kbArticle.count({ where }),
    ]);

    // Update search log with results count
    await this.prisma.kbSearchLog.updateMany({
      where: {
        query,
        createdAt: {
          gte: new Date(Date.now() - 1000), // Last second
        },
      },
      data: {
        results: total,
      },
    });

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
  async getAnalytics() {
    const [
      totalArticles,
      publishedArticles,
      totalCategories,
      totalTags,
      totalViews,
      recentSearches,
      popularArticles,
    ] = await Promise.all([
      this.prisma.kbArticle.count(),
      this.prisma.kbArticle.count({
        where: { status: KbArticleStatus.PUBLISHED },
      }),
      this.prisma.knowledgeBaseCategory.count(),
      this.prisma.kbTag.count(),
      this.prisma.kbArticle.aggregate({ _sum: { viewCount: true } }),
      this.prisma.kbSearchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { query: true, results: true, createdAt: true },
      }),
      this.prisma.kbArticle.findMany({
        where: { status: KbArticleStatus.PUBLISHED },
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
      totalViews: totalViews._sum.viewCount || 0,
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

  private async getOrCreateTags(tagNames: string[]) {
    const tags = await this.prisma.kbTag.findMany({
      where: {
        name: {
          in: tagNames,
        },
      },
    });

    const existingTagNames = tags.map((tag: any) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name)
    );

    if (newTagNames.length > 0) {
      const newTags = await Promise.all(
        newTagNames.map((name) =>
          this.prisma.kbTag.create({
            data: { name },
          })
        )
      );
      tags.push(...newTags);
    }

    return tags;
  }
}
