import React, { useEffect, useState } from 'react';
import {
  knowledgeBaseService,
  type KbArticle,
  type KbFeedback,
} from '../../services/knowledgeBaseService';

type FeedbackState = Pick<KbFeedback, 'rating' | 'comment' | 'helpful'>;

interface ArticleViewProps {}

const ArticleView: React.FC<ArticleViewProps> = () => {
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>({
    rating: 0,
    comment: '',
    helpful: false,
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<KbArticle[]>([]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (slug) {
      void loadArticle(slug);
    }
  }, []);

  const loadArticle = async (slug: string) => {
    try {
      setLoading(true);
      const articleData = await knowledgeBaseService.getArticleBySlug(slug);
      setArticle(articleData);

      const related = await knowledgeBaseService.getArticles({
        categoryId: articleData.categoryId,
        status: 'published',
      });

      setRelatedArticles(
        related.filter((a) => a.id !== articleData.id).slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || feedback.rating === 0) return;

    try {
      await knowledgeBaseService.createFeedback(article.id, feedback);
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Article not found
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
                <a
                  href={`/knowledge-base/category/${article.categoryId}`}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  {article.category.name}
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
                <span className="ml-2 text-gray-900">{article.title}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                {article.category.name}
              </span>
              {article.featured && (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
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
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          <div className="px-8 py-6 border-t bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Was this article helpful?
            </h3>

            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFeedback({ ...feedback, rating: star })
                        }
                        className="text-2xl focus:outline-none"
                      >
                        <span
                          className={
                            star <= feedback.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (optional)
                  </label>
                  <textarea
                    value={feedback.comment}
                    onChange={(e) =>
                      setFeedback({ ...feedback, comment: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us more about your experience..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="helpful"
                    checked={feedback.helpful}
                    onChange={(e) =>
                      setFeedback({ ...feedback, helpful: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="helpful"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    This article was helpful
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Submit Feedback
                  </button>
                  <a
                    href={`/knowledge-base/category/${article.categoryId}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Back to Category
                  </a>
                </div>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                <p className="font-medium">Thank you for your feedback!</p>
                <p className="text-sm">
                  Your input helps us improve our knowledge base.
                </p>
              </div>
            )}
          </div>
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Related Articles
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((related) => (
                <a
                  key={related.id}
                  href={`/knowledge-base/article/${related.slug}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium">
                      {related.category.name}
                    </span>
                    {related.featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 text-lg font-semibold text-gray-900">
                    {related.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {related.excerpt}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleView;
