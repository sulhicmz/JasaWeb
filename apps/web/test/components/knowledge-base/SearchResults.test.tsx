import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchResults from '../../../src/components/knowledge-base/SearchResults';

// Mock the service
const mockKnowledgeBaseService = {
  searchArticles: vi.fn(),
};

vi.mock('../../../src/services/knowledgeBaseService', () => ({
  knowledgeBaseService: mockKnowledgeBaseService,
}));

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries = ['/?q=test']
) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock URLSearchParams and window.location
const mockSearchParams = new URLSearchParams('q=test&category=cat1');
Object.defineProperty(window, 'location', {
  value: {
    search: '?q=test&category=cat1',
  },
  writable: true,
});

// Mock URLSearchParams constructor
vi.stubGlobal(
  'URLSearchParams',
  class URLSearchParamsMock {
    static toString() {
      return mockSearchParams.toString();
    }

    constructor(
      init?:
        | string
        | URLSearchParams
        | Record<string, string>
        | string[][]
        | null
    ) {
      return mockSearchParams;
    }

    get(key: string) {
      return mockSearchParams.get(key);
    }

    entries() {
      return mockSearchParams.entries();
    }
  }
);

describe('SearchResults', () => {
  const mockSearchResults = {
    articles: [
      {
        id: '1',
        title: 'Test Article 1',
        slug: 'test-article-1',
        excerpt: 'This is a test article about search functionality',
        content: 'Full content of test article 1',
        featured: false,
        viewCount: 10,
        status: 'published' as const,
        categoryId: 'cat1',
        category: {
          id: 'cat1',
          name: 'Getting Started',
          description: 'Learn the basics',
        },
        author: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        tags: [{ id: 'tag1', name: 'tutorial', color: 'blue' }],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        publishedAt: '2024-01-15T10:00:00Z',
        _count: {
          feedback: 5,
        },
      },
      {
        id: '2',
        title: 'Test Article 2',
        slug: 'test-article-2',
        excerpt: 'Another test article with different content',
        content: 'Full content of test article 2',
        featured: true,
        viewCount: 25,
        status: 'published' as const,
        categoryId: 'cat2',
        category: {
          id: 'cat2',
          name: 'Advanced Features',
          description: 'Advanced topics',
        },
        author: {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        tags: [
          { id: 'tag2', name: 'advanced', color: 'red' },
          { id: 'tag3', name: 'performance', color: 'green' },
        ],
        createdAt: '2024-01-10T15:30:00Z',
        updatedAt: '2024-01-10T15:30:00Z',
        publishedAt: '2024-01-10T15:30:00Z',
        _count: {
          feedback: 3,
        },
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      pages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search results with query', async () => {
    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(
        screen.getByText('2 results found for "test"')
      ).toBeInTheDocument();
    });

    // Check articles are displayed
    expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    expect(screen.getByText('Test Article 2')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test article about search functionality')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Another test article with different content')
    ).toBeInTheDocument();
  });

  it('displays article metadata correctly', async () => {
    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      // Check categories
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Advanced Features')).toBeInTheDocument();

      // Check authors
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Check tags
      expect(screen.getByText('tutorial')).toBeInTheDocument();
      expect(screen.getByText('advanced')).toBeInTheDocument();
      expect(screen.getByText('performance')).toBeInTheDocument();

      // Check featured badge
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    const emptyResults = {
      articles: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    };

    mockKnowledgeBaseService.searchArticles.mockResolvedValue(emptyResults);

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(
        screen.getByText('0 results found for "test"')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'No articles found matching your search criteria. Try different keywords or browse categories.'
        )
      ).toBeInTheDocument();
    });
  });

  it('handles search errors', async () => {
    mockKnowledgeBaseService.searchArticles.mockRejectedValue(
      new Error('Search failed')
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(
        screen.getByText('An error occurred while searching. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('shows pagination when multiple pages exist', async () => {
    const multiPageResults = {
      ...mockSearchResults,
      pagination: { page: 2, limit: 10, total: 25, pages: 3 },
    };

    mockKnowledgeBaseService.searchArticles.mockResolvedValue(multiPageResults);

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(
        screen.getByText('25 results found for "test"')
      ).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  it('handles article navigation', async () => {
    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      const articleLink = screen.getByText('Test Article 1').closest('a');
      expect(articleLink).toHaveAttribute(
        'href',
        '/knowledge-base/article/test-article-1'
      );
    });
  });

  it('handles new search functionality', async () => {
    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search for articles...');
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search for articles...');
    const searchForm = searchInput.closest('form');

    // Type new search query
    fireEvent.change(searchInput, { target: { value: 'new query' } });

    // Submit form (this would typically trigger navigation)
    if (searchForm) {
      fireEvent.submit(searchForm);
    }

    // Verify the service was called with correct parameters
    expect(mockKnowledgeBaseService.searchArticles).toHaveBeenCalledWith({
      query: 'test',
      category: 'cat1',
    });
  });

  it('displays loading state', async () => {
    // Don't resolve the promise immediately to test loading state
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockKnowledgeBaseService.searchArticles.mockReturnValue(promise);

    renderWithRouter(<SearchResults />);

    // Check for loading spinner
    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('animate-spin');

    // Resolve the promise
    resolvePromise!(mockSearchResults);

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    });
  });

  it('handles different search parameters', async () => {
    // Mock different URL parameters
    Object.defineProperty(window, 'location', {
      value: { search: '?q=advanced&tags=performance&page=2' },
      writable: true,
    });

    const searchParamsWithTags = new URLSearchParams(
      'q=advanced&tags=performance&page=2'
    );
    vi.stubGlobal(
      'URLSearchParams',
      class URLSearchParamsMock {
        constructor() {
          return searchParamsWithTags;
        }

        get(key: string) {
          return searchParamsWithTags.get(key);
        }

        entries() {
          return searchParamsWithTags.entries();
        }
      }
    );

    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />, [
      '/?q=advanced&tags=performance&page=2',
    ]);

    await waitFor(() => {
      expect(
        screen.getByText('2 results found for "advanced"')
      ).toBeInTheDocument();
    });

    expect(mockKnowledgeBaseService.searchArticles).toHaveBeenCalledWith({
      query: 'advanced',
      tags: 'performance',
      page: '2',
    });
  });

  it('handles missing excerpt gracefully', async () => {
    const resultsWithoutExcerpt = {
      ...mockSearchResults,
      articles: [
        {
          ...mockSearchResults.articles[0],
          excerpt: undefined,
        },
      ],
    };

    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      resultsWithoutExcerpt
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      // Should not show "undefined" when excerpt is missing
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });

  it('displays view counts and feedback counts', async () => {
    mockKnowledgeBaseService.searchArticles.mockResolvedValue(
      mockSearchResults
    );

    renderWithRouter(<SearchResults />);

    await waitFor(() => {
      expect(screen.getByText('10 views')).toBeInTheDocument();
      expect(screen.getByText('25 views')).toBeInTheDocument();
      expect(screen.getByText('5 feedback')).toBeInTheDocument();
      expect(screen.getByText('3 feedback')).toBeInTheDocument();
    });
  });
});
