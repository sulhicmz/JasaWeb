import React, { useEffect, useState, useRef } from 'react';
import {
  knowledgeBaseService,
  type KbArticle,
  type KbCategory,
  type KbSearchResult,
} from '../../services/knowledgeBaseService';

interface SearchFilters {
  categoryId?: string;
  tags: string[];
  sortBy: string;
  dateRange: string;
  authorId?: string;
}

interface SearchResultsProps {}

const SearchResults: React.FC<SearchResultsProps> = () => {
  const [results, setResults] = useState<KbArticle[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    sortBy: 'relevance',
    dateRange: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load categories for filters
    void loadCategories();

    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q') || '';
    setQuery(searchQuery);

    if (searchQuery) {
      void performSearch(searchQuery);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Update suggestions when query changes
    if (query.length >= 2) {
      void loadSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadCategories = async () => {
    try {
      const cats = await knowledgeBaseService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const suggestionsData =
        await knowledgeBaseService.getSearchSuggestions(searchQuery);
      setSuggestions(suggestionsData.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const performSearch = async (
    searchQuery: string,
    page = 1,
    appliedFilters = filters
  ) => {
    try {
      setLoading(true);
      const searchParams: any = {
        query: searchQuery,
        page,
        limit: 10,
        ...appliedFilters,
      };

      // Remove empty values
      Object.keys(searchParams).forEach((key) => {
        if (
          !searchParams[key] ||
          (Array.isArray(searchParams[key]) && searchParams[key].length === 0)
        ) {
          delete searchParams[key];
        }
      });

      const searchResults =
        await knowledgeBaseService.searchArticles(searchParams);
      setResults(searchResults.articles);
      setTotalResults(searchResults.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    void performSearch(query, 1, filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query.trim()) {
      void performSearch(query, 1, newFilters);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    window.location.href = suggestion.url;
  };

  const handlePageChange = (page: number) => {
    void performSearch(query, page, filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Advanced Search Bar */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <label htmlFor="search" className="sr-only">
                    Search
                  </label>
                  <input
                    ref={searchInputRef}
                    id="search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() =>
                      query.length >= 2 && setShowSuggestions(true)
                    }
                    placeholder="Search articles, categories, or tags..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />

                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {suggestion.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {suggestion.category}
                                </div>
                              </div>
                              <div className="text-xs text-blue-600">→</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={filters.categoryId || ''}
                      onChange={(e) =>
                        handleFilterChange(
                          'categoryId',
                          e.target.value || undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange('sortBy', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="views">Most Viewed</option>
                      <option value="title">Alphabetical</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        handleFilterChange('dateRange', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {/* Tags Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="Enter tags..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !filters.tags.includes(value)) {
                            handleFilterChange('tags', [
                              ...filters.tags,
                              value,
                            ]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    {filters.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {filters.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                handleFilterChange(
                                  'tags',
                                  filters.tags.filter((t, i) => i !== index)
                                )
                              }
                              className="ml-1 hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        tags: [],
                        sortBy: 'relevance',
                        dateRange: 'all',
                      });
                      if (query.trim()) {
                        void performSearch(query, 1, {
                          tags: [],
                          sortBy: 'relevance',
                          dateRange: 'all',
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Summary */}
        <div className="mb-6">
          {query && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results for "{query}"
                </h1>
                <p className="text-gray-600 mt-1">
                  Found {totalResults} results
                  {Object.values(filters).some(
                    (v) => v && (Array.isArray(v) ? v.length > 0 : true)
                  ) && <span> with active filters</span>}
                </p>
              </div>
              {query && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      setTotalResults(0);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {/* Results List */}
            <div className="space-y-4">
              {results.map((article) => (
                <div
                  key={article.id}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Article Meta */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-blue-600 font-medium">
                            {article.category.name}
                          </span>
                          {article.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                          {(article as any).rank &&
                            filters.sortBy === 'relevance' && (
                              <span className="text-gray-500">
                                Relevance:{' '}
                                {Math.round((article as any).rank * 100)}%
                              </span>
                            )}
                        </div>

                        {/* Article Title */}
                        <h2 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          <a
                            href={`/knowledge-base/article/${article.slug}`}
                            className="block"
                          >
                            {article.title}
                          </a>
                        </h2>

                        {/* Article Excerpt */}
                        <p className="mt-2 text-gray-600 line-clamp-3">
                          {article.excerpt}
                        </p>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {article.tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                style={{
                                  backgroundColor: tag.color
                                    ? `${tag.color}20`
                                    : undefined,
                                  color: tag.color || undefined,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Article Footer */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span>By {article.author.name}</span>
                            <span>•</span>
                            <span>
                              {new Date(
                                article.publishedAt || article.createdAt
                              ).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span>{article.viewCount || 0} views</span>
                            <span>•</span>
                            <a
                              href={`/knowledge-base/article/${article.slug}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Read more →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalResults > 10 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from(
                    { length: Math.min(5, Math.ceil(totalResults / 10)) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-md text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalResults / 10)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No results found for "{query}"
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your search terms, filters, or browse by category to
              find what you're looking for.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => {
                  setFilters({
                    tags: [],
                    sortBy: 'relevance',
                    dateRange: 'all',
                  });
                  void performSearch(query);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <a
                href="/knowledge-base"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Browse Categories
              </a>
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                New Search
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Search Knowledge Base
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Enter a search query above to find articles, tutorials, and guides
              to help you get the most out of JasaWeb.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
