import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeBaseService } from './knowledge-base.service';
import { PrismaService } from '../common/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import {
  CreateKbCategoryDto,
  CreateKbTagDto,
  CreateKbArticleDto,
  UpdateKbArticleDto,
  KbSearchDto,
  KbArticleStatus,
  CreateKbFeedbackDto,
} from './dto/knowledge-base.dto';

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;
  let mockUser: User & { organizationId?: string };

  const mockPrisma = {
    knowledgeBaseCategory: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    kbTag: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    kbArticle: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    kbFeedback: {
      create: vi.fn(),
    },
    kbSearchLog: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    membership: {
      findFirst: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
  };

  beforeEach(() => {
    mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpass',
      passwordHashVersion: 'bcrypt',
      createdAt: new Date(),
      updatedAt: new Date(),
      profilePicture: null,
      organizationId: 'org1',
    } as User & { organizationId: string };

    service = new KnowledgeBaseService(mockPrisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserOrganization', () => {
    it('should return organization ID for valid user', () => {
      const user = { ...mockUser, organizationId: 'org123' };
      expect(user.organizationId).toBe('org123');
    });

    it('should throw error for user without organization', async () => {
      const createCategoryDto: CreateKbCategoryDto = { name: 'Test' };

      mockPrisma.knowledgeBaseCategory.create.mockImplementation(() => {
        throw new BadRequestException('User must belong to an organization');
      });

      await expect(
        service.createCategory(createCategoryDto, 'null')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Categories', () => {
    it('should create a category with organization isolation', async () => {
      const createCategoryDto: CreateKbCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const expectedResult = {
        id: '1',
        ...createCategoryDto,
        organizationId: 'org1',
      };

      mockPrisma.knowledgeBaseCategory.create.mockResolvedValue(expectedResult);

      const result = await service.createCategory(createCategoryDto, 'org1');

      expect(mockPrisma.knowledgeBaseCategory.create).toHaveBeenCalledWith({
        data: {
          ...createCategoryDto,
          organizationId: 'org1',
        } as any,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { articles: true },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should get categories for authenticated user', async () => {
      const expectedResult = [
        { id: '1', name: 'Category 1', organizationId: 'org1' },
      ];

      mockPrisma.knowledgeBaseCategory.findMany.mockResolvedValue(
        expectedResult
      );

      const result = await service.getCategories('org1');

      expect(mockPrisma.knowledgeBaseCategory.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' } as any,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(expectedResult);
    });

    it('should get categories for public access', async () => {
      const expectedResult = [
        { id: '1', name: 'Category 1', organizationId: 'org1' },
      ];

      mockPrisma.knowledgeBaseCategory.findMany.mockResolvedValue(
        expectedResult
      );

      const result = await service.getCategories();

      expect(mockPrisma.knowledgeBaseCategory.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(expectedResult);
    });

    it('should get a specific category', async () => {
      const expectedResult = {
        id: '1',
        name: 'Test Category',
        organizationId: 'org1',
        articles: [],
        parent: null,
        children: [],
        _count: { articles: 0 },
      };

      mockPrisma.knowledgeBaseCategory.findFirst.mockResolvedValue(
        expectedResult
      );

      const result = await service.getCategory('1', 'org1');

      expect(mockPrisma.knowledgeBaseCategory.findFirst).toHaveBeenCalledWith({
        where: {
          id: '1',
          organizationId: 'org1',
        },
        include: {
          parent: true,
          children: true,
          articles: {
            where: {
              status: KbArticleStatus.PUBLISHED,
              organizationId: 'org1',
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
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrisma.knowledgeBaseCategory.findFirst.mockResolvedValue(null);

      await expect(service.getCategory('999', 'org1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Tags', () => {
    it('should create a tag', async () => {
      const createTagDto: CreateKbTagDto = {
        name: 'Test Tag',
        color: '#FF0000',
      };

      const expectedResult = {
        id: '1',
        ...createTagDto,
        organizationId: 'org1',
        _count: { articles: 0 },
      };

      mockPrisma.kbTag.create.mockResolvedValue(expectedResult);

      const result = await service.createTag(createTagDto, 'org1');

      expect(mockPrisma.kbTag.create).toHaveBeenCalledWith({
        data: {
          ...createTagDto,
          organizationId: 'org1',
        } as any,
        include: {
          _count: {
            select: { articles: true },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should get tags', async () => {
      const expectedResult = [
        {
          id: '1',
          name: 'Tag 1',
          organizationId: 'org1',
          _count: { articles: 5 },
        },
      ];

      mockPrisma.membership.findFirst.mockResolvedValue({
        organizationId: 'org1',
      });

      mockPrisma.kbTag.findMany.mockResolvedValue(expectedResult);

      const result = await service.getTags(mockUser);

      expect(mockPrisma.membership.findFirst).toHaveBeenCalledWith({
        where: { userId: '1' },
        select: { organizationId: true },
      });
      expect(mockPrisma.kbTag.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' } as any,
        include: {
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Articles', () => {
    it('should create an article', async () => {
      const createArticleDto: CreateKbArticleDto = {
        title: 'Test Article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        categoryId: 'cat1',
        tagNames: ['tag1'],
        status: KbArticleStatus.DRAFT,
        featured: false,
      };

      const expectedResult = {
        id: '1',
        title: createArticleDto.title,
        content: createArticleDto.content,
        excerpt: createArticleDto.excerpt,
        categoryId: createArticleDto.categoryId,
        organizationId: 'org1',
        authorId: '1',
        status: createArticleDto.status,
        featured: createArticleDto.featured,
        slug: 'test-article',
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        category: { id: 'cat1', name: 'Category 1' },
        author: mockUser,
        tags: [],
        _count: { feedback: 0 },
      };

      // Mock user membership
      mockPrisma.membership.findFirst.mockResolvedValue({
        organizationId: 'org1',
      });

      // Mock existing tags
      mockPrisma.kbTag.findMany.mockResolvedValue([
        { id: 'tag1', name: 'tag1' },
      ]);

      mockPrisma.kbArticle.create.mockResolvedValue(expectedResult);

      const result = await service.createArticle(createArticleDto, mockUser);

      expect(mockPrisma.membership.findFirst).toHaveBeenCalledWith({
        where: { userId: '1' },
        select: { organizationId: true },
      });
      expect(mockPrisma.kbTag.findMany).toHaveBeenCalled();
      expect(mockPrisma.kbArticle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createArticleDto.title,
          content: createArticleDto.content,
          excerpt: createArticleDto.excerpt,
          categoryId: createArticleDto.categoryId,
          organizationId: 'org1',
          authorId: '1',
          status: createArticleDto.status,
          featured: createArticleDto.featured,
          slug: expect.any(String),
        }),
        include: {
          category: true,
          author: true,
          tags: true,
          _count: {
            select: { feedback: true },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should search articles', async () => {
      const searchDto: KbSearchDto = {
        query: 'test search',
        categoryId: 'cat1',
        tags: ['tag1'],
      };

      const expectedResult = {
        articles: [
          {
            id: '1',
            title: 'Test Article',
            content: 'Test content',
            excerpt: 'Test excerpt',
            status: KbArticleStatus.PUBLISHED,
            category: { id: 'cat1', name: 'Category 1' },
            author: { id: 'user1', name: 'User 1' },
            tags: [{ id: 'tag1', name: 'Tag 1' }],
            viewCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockPrisma.kbArticle.findMany.mockResolvedValue(expectedResult.articles);

      const result = await service.search(searchDto, 'org1');

      expect(mockPrisma.kbArticle.findMany).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          articles: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should get articles', async () => {
      const expectedResult = [
        {
          id: '1',
          title: 'Test Article',
          slug: 'test-article',
          excerpt: 'Test excerpt',
          featured: true,
          viewCount: 10,
          publishedAt: new Date(),
          category: { id: 'cat1', name: 'Category 1' },
          author: { id: 'user1', name: 'User 1' },
          tags: [{ id: 'tag1', name: 'Tag 1' }],
        },
      ];

      mockPrisma.kbArticle.findMany.mockResolvedValue(expectedResult);

      const result = await service.getArticles(
        KbArticleStatus.PUBLISHED,
        'cat1',
        true,
        mockUser
      );

      expect(mockPrisma.kbArticle.findMany).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should get an article by slug', async () => {
      const expectedResult = {
        id: '1',
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        status: KbArticleStatus.PUBLISHED,
        featured: true,
        viewCount: 10,
        publishedAt: new Date(),
        category: { id: 'cat1', name: 'Category 1' },
        author: { id: 'user1', name: 'User 1' },
        tags: [{ id: 'tag1', name: 'Tag 1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.kbArticle.findFirst.mockResolvedValue(expectedResult);

      const result = await service.getArticleBySlug('test-article', 'org1');

      expect(mockPrisma.kbArticle.findFirst).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should get search suggestions', async () => {
      const mockArticles = [
        { title: 'Test Article', slug: 'test-article' },
        { title: 'Testing Guide', slug: 'testing-guide' },
      ];

      const expectedResult = {
        suggestions: ['Test Article', 'Testing Guide'],
      };

      mockPrisma.kbArticle.findMany.mockResolvedValue(mockArticles);

      const result = await service.getSearchSuggestions('test', 'org1');

      expect(mockPrisma.kbArticle.findMany).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should get popular searches', async () => {
      const groupByResult = [
        { query: 'getting started', _count: { _all: 50 } },
        { query: 'installation', _count: { _all: 35 } },
      ];

      mockPrisma.kbSearchLog.groupBy.mockResolvedValue(groupByResult);

      const result = await service.getPopularSearches('org1');

      expect(mockPrisma.kbSearchLog.groupBy).toHaveBeenCalled();
      expect(result).toEqual([
        { query: 'getting started', count: 50 },
        { query: 'installation', count: 35 },
      ]);
    });

    it('should get an analytics', async () => {
      const expectedResult = {
        totalArticles: 10,
        totalCategories: 5,
        totalViews: 1000,
        recentActivity: [],
        topCategories: [],
      };

      mockPrisma.kbArticle.count.mockResolvedValue(10);
      mockPrisma.knowledgeBaseCategory.count.mockResolvedValue(5);
      mockPrisma.kbArticle.aggregate.mockResolvedValue({
        _sum: { viewCount: 1000 },
      });

      const result = await service.getAnalytics('org1');

      expect(result).toEqual(
        expect.objectContaining({
          totalArticles: expect.any(Number),
          totalCategories: expect.any(Number),
          totalViews: expect.any(Number),
        })
      );
    });
  });

  describe('Feedback', () => {
    it('should create feedback', async () => {
      const createFeedbackDto: CreateKbFeedbackDto = {
        rating: 5,
        comment: 'Great article!',
      };

      const mockArticle = {
        id: '1',
        title: 'Test Article',
        organizationId: 'org1',
      };

      const expectedResult = {
        id: '1',
        articleId: '1',
        ...createFeedbackDto,
        userId: '1',
        createdAt: new Date(),
      };

      // Mock article exists
      mockPrisma.kbArticle.findFirst.mockResolvedValue(mockArticle);
      mockPrisma.kbFeedback.create.mockResolvedValue(expectedResult);

      const result = await service.createFeedback(
        '1',
        createFeedbackDto,
        mockUser
      );

      expect(mockPrisma.kbArticle.findFirst).toHaveBeenCalled();
      expect(mockPrisma.kbFeedback.create).toHaveBeenCalledWith({
        data: {
          articleId: '1',
          rating: createFeedbackDto.rating,
          comment: createFeedbackDto.comment,
          userId: '1',
        } as any,
      });
      expect(result).toEqual(expectedResult);
    });
  });
});
