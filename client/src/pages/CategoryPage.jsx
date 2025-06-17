import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ARTICLES_BY_CATEGORY } from '../graphql/queries';
import { useUserPreferences } from '../context/UserPreferencesContext';
import NewsGrid from '../components/NewsGrid';

function CategoryPage() {
  const { categoryId } = useParams();
  const { categoryLocationPairs } = useUserPreferences();
  const [categoryName, setCategoryName] = useState('');
  
  // Get location for this category if it exists
  const locationForCategory = categoryLocationPairs[categoryId] || null;
  
  // Format category name for display
  useEffect(() => {
    // Convert category ID to display name (e.g., "business" -> "Business")
    const formattedName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    setCategoryName(formattedName);
  }, [categoryId]);
  
  // Fetch articles for this category
  const { loading, error, data, refetch } = useQuery(GET_ARTICLES_BY_CATEGORY, {
    variables: {
      category: categoryId,
      location: locationForCategory,
      limit: 20,
      sources: [] // Optional: Allow user to filter by sources in the future
    },
    fetchPolicy: 'network-only' // Don't use cache for news
  });
  
  // Function to manually refresh news
  const handleRefresh = () => {
    refetch();
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="category-page">
        <div className="page-header">
          <h1>{categoryName} News</h1>
          <button className="refresh-button" onClick={handleRefresh} disabled>
            Refreshing...
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading {categoryName.toLowerCase()} news...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="category-page">
        <div className="page-header">
          <h1>{categoryName} News</h1>
          <button className="refresh-button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
        <div className="error-container">
          <p>Error loading news: {error.message}</p>
          <Link to="/preferences" className="cta-button">Update Preferences</Link>
        </div>
      </div>
    );
  }
  
  // Check if we have articles
  const articles = data?.articlesByCategory?.articles || [];
  const errors = data?.articlesByCategory?.errors || [];
  
  return (
    <div className="category-page">
      <div className="page-header">
        <h1>{categoryName} News</h1>
        <div className="header-actions">
          <button className="refresh-button" onClick={handleRefresh}>
            Refresh News
          </button>
          <Link to="/preferences" className="preferences-link">
            Edit Preferences
          </Link>
        </div>
      </div>
      
      {errors.length > 0 && (
        <div className="api-errors">
          <p>Some news sources encountered errors:</p>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error.source}: {error.message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {locationForCategory && (
        <div className="location-filter">
          <p>Showing news for location: {locationForCategory}</p>
        </div>
      )}
      
      {articles.length > 0 ? (
        <NewsGrid articles={articles} />
      ) : (
        <div className="no-articles">
          <p>No articles found for {categoryName.toLowerCase()}.</p>
          <Link to="/preferences" className="cta-button">Update Preferences</Link>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;