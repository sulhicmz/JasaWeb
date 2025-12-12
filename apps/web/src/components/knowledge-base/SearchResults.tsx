import React, { useEffect, useState } from 'react';
import {
  knowledgeBaseService,
  type KbArticle,
} from '../../services/knowledgeBaseService';

interface SearchResultsProps {}

const SearchResults: React.FC<SearchResultsProps> = () => {
  const [results, setResults] = useState<KbArticle[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q') || '';
    setQuery(searchQuery);

    if (searchQuery) {
      void performSearch(searchQuery);
    } else {
      setLoading(false);
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const searchResults = await knowledgeBaseService.searchArticles({
        query: searchQuery,
      });
      setResults(searchResults.articles);
      setTotalResults(searchResults.pagination.total);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.location.href = `/knowledge-base/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Found {totalResults} results
            </div>
            {results.map((article) => (
              <a
                key={article.id}
                href={`/knowledge-base/article/${article.slug}`}
                className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <span>{article.category.name}</span>
                    {article.featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {article.viewCount} views
                  </div>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  {article.title}
                </h2>
                <p className="mt-1 text-gray-600 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="mt-3 flex items-center text-sm text-gray-500 space-x-3">
                  <span>{article.author.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(
                      article.publishedAt || article.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No results found
            </h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse by category.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/knowledge-base"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Knowledge Base
              </a>
              <a
                href="/knowledge-base/search"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Search
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
