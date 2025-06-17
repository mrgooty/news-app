import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import NewsGrid from '../components/NewsGrid';
import { GET_ARTICLES_BY_CATEGORY } from '../graphql/queries';

function CategoryPage() {
  const { categoryId } = useParams();
  const { loading, error, data } = useQuery(GET_ARTICLES_BY_CATEGORY, {
    variables: { category: categoryId, limit: 20 },
  });

  // Convert category ID to display name (e.g., "technology" -> "Technology")
  const categoryName = categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : '';

  if (loading) return <div className="loading">Loading articles...</div>;
  if (error) return <div className="error">Error loading articles: {error.message}</div>;

  const articles = data?.articlesByCategory?.articles || [];
  const errors = data?.articlesByCategory?.errors || [];

  return (
    <div className="category-page">
      <h1>{categoryName} News</h1>

      {errors.length > 0 && (
        <div className="api-errors">
          <p>Some sources failed to load:</p>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e.source}: {e.message}</li>
            ))}
          </ul>
        </div>
      )}

      {articles.length > 0 ? (
        <NewsGrid articles={articles} />
      ) : (
        <div className="no-articles">No articles found for this category.</div>
      )}
    </div>
  );
}

export default CategoryPage;