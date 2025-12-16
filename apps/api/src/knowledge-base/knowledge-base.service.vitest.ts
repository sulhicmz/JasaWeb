import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeBaseService } from './knowledge-base.service';
import { PrismaService } from '../common/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CreateKbCategoryDto,
  KbArticleStatus,
  CreateKbFeedbackDto,
} from './dto/knowledge-base.dto';

describe('KnowledgeBaseService - Basic Tests', () => {
  let service: KnowledgeBaseService;
  let mockPrisma: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpass',
    passwordHashVersion: 'bcrypt',
    createdAt: new Date(),
    updatedAt: new Date(),
    profilePicture: null,
  };

  beforeEach(() => {
    mockPrisma = {
      knowledgeBaseCategory: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      kbTag: {
        create: vi.fn(),
        findMany: vi.fn(),
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
        $queryRawUnsafe: vi.fn(),
      },
      kbFeedback: {
        create: vi.fn(),
      },
      kbSearchLog: {
        create: vi.fn(),
        updateMany: vi.fn(),
        groupBy: vi.fn(),
      },
      membership: {
        findFirst: vi.fn(),
      },
    };

    service = new KnowledgeBaseService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category', async () => {
    const createDto: CreateKbCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
    };

    const expectedResult = {
      id: 'cat-1',
      name: 'Test Category',
      description: 'Test Description',
      organizationId: 'org-1',
    };

    mockPrisma.knowledgeBaseCategory.create.mockResolvedValue(expectedResult);

    const result = await service.createCategory(createDto, 'org-1');

    expect(result).toBe(expectedResult);
    expect(mockPrisma.knowledgeBaseCategory.create).toHaveBeenCalledWith({
      data: { ...createDto, organizationId: 'org-1' },
      include: {
        parent: true,
        children: true,
        _count: { select: { articles: true } },
      },
    });
  });

  it('should get categories', async () => {
    const categories = [
      { id: 'cat-1', name: 'Category 1' },
      { id: 'cat-2', name: 'Category 2' },
    ];

    mockPrisma.knowledgeBaseCategory.findMany.mockResolvedValue(categories);

    const result = await service.getCategories('org-1');

    expect(result).toBe(categories);
    expect(mockPrisma.knowledgeBaseCategory.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      include: {
        parent: true,
        children: true,
        _count: { select: { articles: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  });

  it('should throw error when category not found', async () => {
    mockPrisma.knowledgeBaseCategory.findFirst.mockResolvedValue(null);

    await expect(service.getCategory('non-existent', 'org-1')).rejects.toThrow(
      NotFoundException
    );
  });

  it('should create feedback for article', async () => {
    const articleId = 'article-1';
    const feedbackDto: CreateKbFeedbackDto = {
      rating: 5,
      comment: 'Great article!',
    };

    const mockArticle = { id: articleId, title: 'Test Article' };
    const expectedFeedback = {
      id: 'feedback-1',
      rating: 5,
      comment: 'Great article!',
    };

    mockPrisma.kbArticle.findUnique.mockResolvedValue(mockArticle);
    mockPrisma.kbFeedback.create.mockResolvedValue(expectedFeedback);

    const result = await service.createFeedback(articleId, feedbackDto);

    expect(result).toBe(expectedFeedback);
    expect(mockPrisma.kbFeedback.create).toHaveBeenCalledWith({
      data: { ...feedbackDto, articleId, userId: undefined },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  });

  it('should throw error when creating feedback for non-existent article', async () => {
    mockPrisma.kbArticle.findUnique.mockResolvedValue(null);

    await expect(
      service.createFeedback('non-existent', { rating: 5 })
    ).rejects.toThrow('Article not found');
  });

  it('should generate slug correctly', () => {
    const slug = (service as any).generateSlug(
      'Test Article with Spaces & Symbols!'
    );
    expect(slug).toBe('test-article-with-spaces-symbols');
  });

  it('should get search suggestions for valid query', async () => {
    const query = 'test';
    const mockSuggestions = [
      { id: 'article-1', title: 'Test Article', slug: 'test-article' },
    ];
    const mockTags = [{ name: 'test', color: 'blue' }];

    mockPrisma.kbArticle.findMany.mockResolvedValue(mockSuggestions);
    mockPrisma.kbTag.findMany.mockResolvedValue(mockTags);

    const result = await service.getSearchSuggestions(query, 'org-1');

    expect(result.suggestions).toHaveLength(1);
    expect(result.tags).toEqual(mockTags);
    expect(result.articles).toEqual(mockSuggestions);
  });

  it('should return empty suggestions for short query', async () => {
    const result = await service.getSearchSuggestions('t', 'org-1');
    expect(result).toEqual({ suggestions: [], articles: [] });
  });
});
