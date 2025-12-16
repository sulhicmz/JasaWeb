import React, { useEffect, useState, useCallback } from 'react';
import {
  knowledgeBaseService,
  type KbArticle,
  type KbCategory,
  type KbSearchResult,
} from '../../services/knowledgeBaseService';

interface KnowledgeBaseHomeProps {
  userRole?: 'owner' | 'admin' | 'reviewer' | 'finance' | 'member' | 'guest';
  organizationId?: string;
}

const KnowledgeBaseHome: React.FC<KnowledgeBaseHomeProps> = ({
  userRole = 'guest',
  organizationId,
}) => {
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<KbArticle[]>([]);
  const [recentArticles, setRecentArticles] = useState<KbArticle[]>([]);
  const [popularSearches, setPopularSearches] = useState<
    Array<{ query: string; count: number }>
  >([]);
  const [trendingArticles, setTrendingArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get articles based on user role - include unpublished content for admins/owners
      const includeUnpublished = ['owner', 'admin'].includes(userRole);

      const [categoriesData, featuredData, recentData, popularData] =
        await Promise.all([
          knowledgeBaseService.getCategories(organizationId),
          knowledgeBaseService.getArticles({
            featured: true,
            status: includeUnpublished ? undefined : 'published',
            organizationId,
          }),
          knowledgeBaseService.getArticles({
            status: includeUnpublished ? undefined : 'published',
            limit: 6,
            organizationId,
          }),
          organizationId
            ? knowledgeBaseService
                .getPopularSearches(organizationId)
                .catch(() => ({ popularSearches: [], trendingArticles: [] }))
            : Promise.resolve({ popularSearches: [], trendingArticles: [] }),
        ]);

      setCategories(categoriesData);
      setFeaturedArticles(featuredData);
      setRecentArticles(recentData);
      setPopularSearches(popularData.popularSearches);
      setTrendingArticles(popularData.trendingArticles);
    } catch (error) {
      console.error('Error loading knowledge base data:', error);
    } finally {
      setLoading(false);
    }
  }, [userRole, organizationId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/knowledge-base/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold mb-4">
                JasaWeb Knowledge Base
              </h1>
              {/* Admin/Owner actions */}
              {['owner', 'admin'].includes(userRole) && (
                <div className="flex gap-2 mb-4">
                  <a
                    href="/knowledge-base/admin/articles/new"
                    className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium"
                  >
                    + New Article
                  </a>
                  <a
                    href="/knowledge-base/admin/analytics"
                    className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 text-sm font-medium"
                  >
                    Analytics
                  </a>
                </div>
              )}
            </div>
            <p className="text-lg text-blue-100">
              Cari jawaban cepat untuk pertanyaan Anda atau jelajahi artikel
              berdasarkan kategori.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative rounded-lg shadow-lg overflow-hidden">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari artikel, kategori, atau kata kunci..."
                className="w-full px-6 py-4 text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-blue-100 mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search.query);
                      window.location.href = `/knowledge-base/search?q=${encodeURIComponent(search.query)}`;
                    }}
                    className="px-3 py-1 bg-blue-800 bg-opacity-50 text-blue-100 rounded-full text-sm hover:bg-opacity-70 transition-all"
                  >
                    {search.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Articles Section */}
      {trendingArticles.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🔥 Trending Articles
              </h2>
              <a
                href="/knowledge-base/search"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <span>{article.category.name}</span>
                      {article.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <a
                        href={`/knowledge-base/article/${article.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {article.title}
                      </a>
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.author.name}</span>
                      <span>{article.viewCount || 0} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Kategori</h2>
                <div className="flex items-center gap-4">
                  <a
                    href="/knowledge-base"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Lihat semua
                  </a>
                  {['owner', 'admin'].includes(userRole) && (
                    <a
                      href="/knowledge-base/admin/categories/new"
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      + Add Category
                    </a>
                  )}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`/knowledge-base/category/${category.id}`}
                    className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category._count?.articles !== undefined && (
                        <span className="text-sm text-gray-500">
                          {category._count.articles} artikel
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {category.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                      Jelajahi
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <section className="grid gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Featured Articles
                  </h2>
                  <a
                    href="/knowledge-base/search?q=featured"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Lihat semua
                  </a>
                </div>
                <div className="space-y-4">
                  {featuredArticles.map((article) => (
                    <a
                      key={article.id}
                      href={`/knowledge-base/article/${article.slug}`}
                      className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {article.title}
                        </h3>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Featured
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="mt-3 flex items-center text-sm text-gray-500 space-x-3">
                        <span>{article.category.name}</span>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Artikel Terbaru
                  </h2>
                  <a
                    href="/knowledge-base/search?q=latest"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Lihat semua
                  </a>
                </div>
                <div className="space-y-4">
                  {recentArticles.map((article) => (
                    <a
                      key={article.id}
                      href={`/knowledge-base/article/${article.slug}`}
                      className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {article.title}
                        </h3>
                        {article.tags.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {article.tags[0].name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="mt-3 flex items-center text-sm text-gray-500 space-x-3">
                        <span>{article.category.name}</span>
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
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseHome;
