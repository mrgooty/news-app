import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import NewsGrid from '../components/NewsGrid';

// GraphQL query to fetch articles by category
const GET_ARTICLES_BY_CATEGORY = gql`
  query GetArticlesByCategory($category: String!, $limit: Int) {
    articlesByCategory(category: $category, limit: $limit) {
      id
      title
      description
      imageUrl
      source
      publishedAt
      url
    }
  }
`;

function CategoryPage() {
  const { categoryId } = useParams();
  const { loading, error, data } = useQuery(GET_ARTICLES_BY_CATEGORY, {
    variables: { category: categoryId, limit: 20 },
  });

  // Convert category ID to display name (e.g., "technology" -> "Technology")
  const categoryName = categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : '';

  if (loading) return <div className="loading">Loading articles...</div>;
  if (error) return <div className="error">Error loading articles: {error.message}</div>;

  return (
    <div className="category-page">
      <h1>{categoryName} News</h1>
      
      {data.articlesByCategory.length > 0 ? (
        <NewsGrid articles={data.articlesByCategory} />
      ) : (
        <div className="no-articles">No articles found for this category.</div>
      )}
    </div>
  );
}

export default CategoryPage;