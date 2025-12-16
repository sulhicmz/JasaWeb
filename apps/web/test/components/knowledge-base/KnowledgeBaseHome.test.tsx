import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import KnowledgeBaseHome from '../../../src/components/knowledge-base/KnowledgeBaseHome';
import * as knowledgeBaseService from '../../../src/services/knowledgeBaseService';

// Mock the service
vi.mock('../../../src/services/knowledgeBaseService');

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock console.error to avoid noise in test output
vi.spyOn(console, 'error').mockImplementation(() => {});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('KnowledgeBaseHome', () => {
  const mockCategories = [
    {
      id: '1',
      name: 'Getting Started',
      description: 'Learn the basics of the platform',
      order: 1,
      _count: { articles: 5 },
    },
    {
      id: '2',
      name: 'Advanced Features',
      description: 'Explore advanced capabilities',
      order: 2,
      _count: { articles: 3 },
    },
  ];

  const mockFeaturedArticles = [
    {
      id: '1',
      title: 'Getting Started Guide',
      slug: 'getting-started-guide',
      excerpt: 'Learn how to use our platform effectively',
      featured: true,
      category: { name: 'Getting Started' },
      publishedAt: '2024-01-15T10:00:00Z',
      tags: [{ name: 'beginner' }],
    },
    {
      id: '2',
      title: 'Advanced Analytics',
      slug: 'advanced-analytics',
      excerpt: 'Deep dive into analytics features',
      featured: true,
      category: { name: 'Advanced Features' },
      publishedAt: '2024-01-10T15:30:00Z',
      tags: [{ name: 'analytics' }],
    },
  ];

  const mockRecentArticles = [
    {
      id: '3',
      title: 'New Feature Release',
      slug: 'new-feature-release',
      excerpt: 'Announcing our latest features',
      featured: false,
      category: { name: 'Getting Started' },
      publishedAt: '2024-01-20T09:00:00Z',
      tags: [{ name: 'updates' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders loading state initially', () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    // Check for loading spinner
    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('animate-spin');
  });

  it('renders knowledge base home with data', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue(mockCategories);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue(mockFeaturedArticles);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(screen.getByText('JasaWeb Knowledge Base')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cari jawaban cepat untuk pertanyaan Anda atau jelajahi artikel berdasarkan kategori.'
        )
      ).toBeInTheDocument();
    });

    // Check categories
    await waitFor(() => {
      expect(screen.getByText('Kategori')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(
        screen.getByText('Learn the basics of the platform')
      ).toBeInTheDocument();
      expect(screen.getByText('5 artikel')).toBeInTheDocument();
      expect(screen.getByText('Advanced Features')).toBeInTheDocument();
    });

    // Check search input
    const searchInput = screen.getByPlaceholderText(
      'Cari artikel, kategori, atau kata kunci...'
    );
    expect(searchInput).toBeInTheDocument();

    // Check search button
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          'Cari artikel, kategori, atau kata kunci...'
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Cari artikel, kategori, atau kata kunci...'
    );
    const searchButton = screen.getByRole('button', { name: 'Search' });

    // Type search query
    fireEvent.change(searchInput, {
      target: { value: 'how to use dashboard' },
    });

    // Submit search
    fireEvent.click(searchButton);

    // Check if navigation occurred
    expect(mockLocation.href).toBe(
      '/knowledge-base/search?q=how%20to%20use%20dashboard'
    );
  });

  it('handles search with form submit', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          'Cari artikel, kategori, atau kata kunci...'
        )
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Cari artikel, kategori, atau kata kunci...'
    );
    const searchForm = searchInput.closest('form');

    // Type search query
    fireEvent.change(searchInput, { target: { value: 'tutorial' } });

    // Submit form
    if (searchForm) {
      fireEvent.submit(searchForm);
    }

    // Check if navigation occurred
    expect(mockLocation.href).toBe('/knowledge-base/search?q=tutorial');
  });

  it('does not submit empty search', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Search' })
      ).toBeInTheDocument();
    });

    const searchButton = screen.getByRole('button', { name: 'Search' });

    // Click search button with empty input
    fireEvent.click(searchButton);

    // Should not navigate with empty query
    expect(mockLocation.href).toBe('');
  });

  it('displays featured articles section', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(knowledgeBaseService.knowledgeBaseService.getArticles)
      .mockResolvedValueOnce(mockFeaturedArticles) // First call for featured articles
      .mockResolvedValueOnce(mockRecentArticles); // Second call for recent articles

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(screen.getByText('Featured Articles')).toBeInTheDocument();
      expect(screen.getByText('Getting Started Guide')).toBeInTheDocument();
      expect(
        screen.getByText('Learn how to use our platform effectively')
      ).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    // Check category and date display
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('•')).toBeInTheDocument(); // Date separator
  });

  it('displays recent articles section', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(knowledgeBaseService.knowledgeBaseService.getArticles)
      .mockResolvedValueOnce(mockFeaturedArticles) // First call for featured articles
      .mockResolvedValueOnce(mockRecentArticles); // Second call for recent articles

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(screen.getByText('Artikel Terbaru')).toBeInTheDocument();
      expect(screen.getByText('New Feature Release')).toBeInTheDocument();
      expect(
        screen.getByText('Announcing our latest features')
      ).toBeInTheDocument();
      expect(screen.getByText('updates')).toBeInTheDocument(); // Tag
    });
  });

  it('handles service load errors gracefully', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockRejectedValue(new Error('Network error'));
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockRejectedValue(new Error('Network error'));

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      // Should not crash and should still render basic structure
      expect(screen.getByText('JasaWeb Knowledge Base')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'Cari artikel, kategori, atau kata kunci...'
        )
      ).toBeInTheDocument();
    });

    // Should not show loading state after error
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders category links correctly', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue(mockCategories);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      const categoryLink = screen.getByText('Getting Started').closest('a');
      expect(categoryLink).toHaveAttribute(
        'href',
        '/knowledge-base/category/1'
      );
    });
  });

  it('renders article links correctly', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(knowledgeBaseService.knowledgeBaseService.getArticles)
      .mockResolvedValueOnce(mockFeaturedArticles)
      .mockResolvedValueOnce(mockRecentArticles);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      const articleLink = screen
        .getByText('Getting Started Guide')
        .closest('a');
      expect(articleLink).toHaveAttribute(
        'href',
        '/knowledge-base/article/getting-started-guide'
      );
    });
  });

  it('displays proper navigation links', async () => {
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      // Check "Lihat semua" links
      const viewAllLinks = screen.getAllByText('Lihat semua');
      expect(viewAllLinks).toHaveLength(3); // Categories, Featured, Recent
    });
  });

  it('shows fallback text for missing descriptions', async () => {
    const categoryWithNoDescription = {
      ...mockCategories[0],
      description: undefined,
    };

    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getCategories
    ).mockResolvedValue([categoryWithNoDescription]);
    vi.mocked(
      knowledgeBaseService.knowledgeBaseService.getArticles
    ).mockResolvedValue([]);

    renderWithRouter(<KnowledgeBaseHome />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      // Should not break when description is missing
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });
});
