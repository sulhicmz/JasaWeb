import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { User, KbArticleStatus } from '@prisma/client';
import {
  CreateKbCategoryDto,
  CreateKbTagDto,
  CreateKbArticleDto,
  UpdateKbArticleDto,
  KbSearchDto,
} from './dto/knowledge-base.dto';

describe('KnowledgeBaseController', () => {
  let controller: KnowledgeBaseController;
  let service: KnowledgeBaseService;
  let mockUser: User;

  beforeEach(async () => {
    mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org1',
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: 'hash',
      emailVerified: true,
    };

    const mockKnowledgeBaseService = {
      createCategory: jest.fn(),
      getCategories: jest.fn(),
      getCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      createTag: jest.fn(),
      getTags: jest.fn(),
      createArticle: jest.fn(),
      getArticles: jest.fn(),
      getArticle: jest.fn(),
      getArticleBySlug: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
      search: jest.fn(),
      createFeedback: jest.fn(),
      getAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeBaseController],
      providers: [
        {
          provide: KnowledgeBaseService,
          useValue: mockKnowledgeBaseService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MultiTenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KnowledgeBaseController>(KnowledgeBaseController);
    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Categories', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateKbCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const expectedResult = {
        id: '1',
        ...createCategoryDto,
        organizationId: 'org1',
      };

      jest
        .spyOn(service, 'createCategory')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.createCategory(
        createCategoryDto,
        mockRequest
      );

      expect(service.createCategory).toHaveBeenCalledWith(
        createCategoryDto,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should get categories', async () => {
      const expectedResult = [{ id: '1', name: 'Category 1' }];
      jest
        .spyOn(service, 'getCategories')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getCategories(mockRequest);

      expect(service.getCategories).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should get a category by id', async () => {
      const categoryId = '1';
      const expectedResult = { id: categoryId, name: 'Category 1' };
      jest
        .spyOn(service, 'getCategory')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getCategory(categoryId, mockRequest);

      expect(service.getCategory).toHaveBeenCalledWith(categoryId, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should update a category', async () => {
      const categoryId = '1';
      const updateCategoryDto = { name: 'Updated Category' };
      const expectedResult = { id: categoryId, ...updateCategoryDto };

      jest
        .spyOn(service, 'updateCategory')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.updateCategory(
        categoryId,
        updateCategoryDto,
        mockRequest
      );

      expect(service.updateCategory).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should delete a category', async () => {
      const categoryId = '1';
      const expectedResult = { id: categoryId, name: 'Deleted Category' };

      jest
        .spyOn(service, 'deleteCategory')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.deleteCategory(categoryId, mockRequest);

      expect(service.deleteCategory).toHaveBeenCalledWith(categoryId, mockUser);
      expect(result).toEqual(expectedResult);
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
      };

      jest.spyOn(service, 'createTag').mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.createTag(createTagDto, mockRequest);

      expect(service.createTag).toHaveBeenCalledWith(createTagDto, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should get tags', async () => {
      const expectedResult = [{ id: '1', name: 'Tag 1' }];
      jest.spyOn(service, 'getTags').mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getTags(mockRequest);

      expect(service.getTags).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Articles', () => {
    it('should create an article', async () => {
      const createArticleDto: CreateKbArticleDto = {
        title: 'Test Article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        categoryId: '1',
        status: KbArticleStatus.PUBLISHED,
        tagNames: ['tag1', 'tag2'],
      };

      const expectedResult = {
        id: '1',
        ...createArticleDto,
        organizationId: 'org1',
        slug: 'test-article',
      };

      jest
        .spyOn(service, 'createArticle')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.createArticle(
        createArticleDto,
        mockRequest
      );

      expect(service.createArticle).toHaveBeenCalledWith(
        createArticleDto,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should get articles', async () => {
      const expectedResult = [
        {
          id: '1',
          title: 'Article 1',
          status: KbArticleStatus.PUBLISHED,
        },
      ];

      jest
        .spyOn(service, 'getArticles')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getArticles(
        KbArticleStatus.PUBLISHED,
        '1',
        'true',
        mockRequest
      );

      expect(service.getArticles).toHaveBeenCalledWith(
        KbArticleStatus.PUBLISHED,
        '1',
        true,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should get an article by id', async () => {
      const articleId = '1';
      const expectedResult = {
        id: articleId,
        title: 'Article 1',
        viewCount: 1,
      };

      jest
        .spyOn(service, 'getArticle')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getArticle(articleId, mockRequest);

      expect(service.getArticle).toHaveBeenCalledWith(articleId, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should get an article by slug', async () => {
      const slug = 'test-article';
      const expectedResult = {
        id: '1',
        slug,
        title: 'Article 1',
        viewCount: 1,
      };

      jest
        .spyOn(service, 'getArticleBySlug')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getArticleBySlug(slug, mockRequest);

      expect(service.getArticleBySlug).toHaveBeenCalledWith(slug, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should update an article', async () => {
      const articleId = '1';
      const updateArticleDto: UpdateKbArticleDto = {
        title: 'Updated Article',
      };

      const expectedResult = {
        id: articleId,
        ...updateArticleDto,
      };

      jest
        .spyOn(service, 'updateArticle')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.updateArticle(
        articleId,
        updateArticleDto,
        mockRequest
      );

      expect(service.updateArticle).toHaveBeenCalledWith(
        articleId,
        updateArticleDto,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should delete an article', async () => {
      const articleId = '1';
      const expectedResult = { id: articleId, title: 'Deleted Article' };

      jest
        .spyOn(service, 'deleteArticle')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.deleteArticle(articleId, mockRequest);

      expect(service.deleteArticle).toHaveBeenCalledWith(articleId, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Search', () => {
    it('should search articles', async () => {
      const searchDto: KbSearchDto = {
        query: 'test query',
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        articles: [{ id: '1', title: 'Article 1' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      jest.spyOn(service, 'search').mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.search(searchDto, mockRequest);

      expect(service.search).toHaveBeenCalledWith(searchDto, mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should search articles without authentication', async () => {
      const searchDto: KbSearchDto = {
        query: 'test query',
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        articles: [{ id: '1', title: 'Article 1' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      jest.spyOn(service, 'search').mockResolvedValue(expectedResult as any);

      const mockRequest = {} as any;
      const result = await controller.search(searchDto, mockRequest);

      expect(service.search).toHaveBeenCalledWith(searchDto, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Analytics', () => {
    it('should get analytics', async () => {
      const expectedResult = {
        totalArticles: 10,
        publishedArticles: 8,
        totalCategories: 3,
        totalTags: 15,
        totalViews: 100,
        recentSearches: [],
        popularArticles: [],
      };

      jest
        .spyOn(service, 'getAnalytics')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.getAnalytics(mockRequest);

      expect(service.getAnalytics).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Multi-tenant Security', () => {
    it('should enforce organization isolation for category creation', async () => {
      const createCategoryDto: CreateKbCategoryDto = {
        name: 'Test Category',
      };

      const expectedResult = {
        id: '1',
        ...createCategoryDto,
        organizationId: 'org1',
      };

      jest
        .spyOn(service, 'createCategory')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = { user: mockUser } as any;
      await controller.createCategory(createCategoryDto, mockRequest);

      expect(service.createCategory).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          organizationId: 'org1',
        })
      );
    });

    it('should handle public endpoints gracefully without authentication', async () => {
      const expectedResult = [{ id: '1', name: 'Public Category' }];
      jest
        .spyOn(service, 'getCategories')
        .mockResolvedValue(expectedResult as any);

      const mockRequest = {} as any;
      const result = await controller.getCategories(mockRequest);

      expect(service.getCategories).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});
