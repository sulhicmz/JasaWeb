import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';

describe('KnowledgeBaseController', () => {
  let controller: KnowledgeBaseController;
  let service: KnowledgeBaseService;

  beforeEach(async () => {
    const mockService = {
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
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<KnowledgeBaseController>(KnowledgeBaseController);
    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return an array of categories', async () => {
      const expectedCategories = [
        {
          id: '1',
          name: 'Getting Started',
          description: 'Learn the basics',
          _count: { articles: 5 },
        },
      ];

      jest
        .spyOn(service, 'getCategories')
        .mockResolvedValue(expectedCategories as any);

      const result = await controller.getCategories();
      expect(result).toEqual(expectedCategories);
      expect(service.getCategories).toHaveBeenCalled();
    });
  });

  describe('getArticles', () => {
    it('should return articles with filters', async () => {
      const expectedArticles = [
        {
          id: '1',
          title: 'Test Article',
          slug: 'test-article',
          status: 'published',
          featured: true,
        },
      ];

      jest
        .spyOn(service, 'getArticles')
        .mockResolvedValue(expectedArticles as any);

      const result = await controller.getArticles(
        'published',
        'category-1',
        'true'
      );
      expect(result).toEqual(expectedArticles);
      expect(service.getArticles).toHaveBeenCalledWith(
        'published',
        'category-1',
        true
      );
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const searchDto = {
        query: 'test query',
        page: 1,
        limit: 10,
      };

      const expectedResults = {
        articles: [
          {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      jest.spyOn(service, 'search').mockResolvedValue(expectedResults as any);

      const result = await controller.search(searchDto, {
        user: { id: 'user-1' },
      } as any);
      expect(result).toEqual(expectedResults);
      expect(service.search).toHaveBeenCalledWith(searchDto, {
        user: { id: 'user-1' },
      });
    });
  });
});
