import React, { useEffect, useState } from 'react';
import {
  knowledgeBaseService,
  type KbArticle,
  type KbCategory,
} from '../../services/knowledgeBaseService';

interface CategoryViewProps {}

const CategoryView: React.FC<CategoryViewProps> = () => {
  const [category, setCategory] = useState<KbCategory | null>(null);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const categoryId = pathParts[pathParts.length - 1];

    if (categoryId) {
      void loadCategory(categoryId);
    }
  }, []);

  const loadCategory = async (categoryId: string) => {
    try {
      setLoading(true);

      const [categoryData, categoryArticles] = await Promise.all([
        knowledgeBaseService.getCategory(categoryId),
        knowledgeBaseService.getArticles({ categoryId, status: 'published' }),
      ]);

      setCategory(categoryData);
      setArticles(categoryArticles);
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Category not found
          </h1>
          <a
            href="/knowledge-base"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Knowledge Base
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a
                  href="/knowledge-base"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Knowledge Base
                </a>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-2 text-gray-900">{category.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {category.name}
              </h1>
              {category._count?.articles !== undefined && (
                <span className="text-sm text-gray-500">
                  {category._count.articles} articles
                </span>
              )}
            </div>
            {category.description && (
              <p className="mt-2 text-gray-600">{category.description}</p>
            )}
          </div>

          {articles.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="px-8 py-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <a
                      href={`/knowledge-base/article/${article.slug}`}
                      className="text-2xl font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </a>
                    {article.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>By {article.author.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(
                          article.publishedAt || article.createdAt
                        ).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{article.viewCount} views</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded"
                          style={{
                            backgroundColor: tag.color
                              ? `${tag.color}20`
                              : undefined,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-8 py-6 text-center text-gray-500">
              No articles found in this category yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryView;
