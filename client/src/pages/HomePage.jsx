import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_TOP_STORIES_ACROSS_CATEGORIES } from '../graphql/queries';
import { useUserPreferences } from '../context/UserPreferencesContext';
import NewsGrid from '../components/NewsGrid';

function HomePage() {
  const { selectedCategories, categoryLocationPairs } = useUserPreferences();
  const [hasPreferences, setHasPreferences] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Check if user has set preferences
  useEffect(() => {
    setHasPreferences(selectedCategories.length > 0);
  }, [selectedCategories]);

  // Prepare variables for the GraphQL query
  const queryVariables = {
    categories: selectedCategories,
    limit: 20,
    location: null, // We'll handle multiple locations in the backend
    sources: [] // Optional: Allow user to filter by sources in the future
  };

  // Only fetch if user has preferences
  const { loading, error, data, refetch } = useQuery(GET_TOP_STORIES_ACROSS_CATEGORIES, {
    variables: queryVariables,
    skip: !hasPreferences,
    fetchPolicy: 'network-only' // Don't use cache for news
  });

  // Function to manually refresh news
  const handleRefresh = () => {
    if (hasPreferences) {
      refetch();
    }
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };

  // If no preferences are set, show onboarding
  if (!hasPreferences) {
    return (
      <div className="home-page">
        <section className="hero-section">
          <h1>Stay Informed with AI-Powered News</h1>
          <p>Get the latest news from multiple sources, organized by AI for a better reading experience.</p>
          <Link to="/preferences" className="cta-button">Customize Your News Feed</Link>
        </section>
        
        <section className="features-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📰</div>
              <h3>Personalized Categories</h3>
              <p>Select the news categories that matter most to you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌎</div>
              <h3>Location Pairing</h3>
              <p>Pair categories with specific locations for relevant news.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Aggregation</h3>
              <p>Our AI analyzes and organizes news for a better reading experience.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Multiple Sources</h3>
              <p>Get news from various trusted sources in one place.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="home-page">
        <div className="page-header">
          <h1>Your Personalized News Feed</h1>
          <div className="header-actions">
            <button className="refresh-button" onClick={handleRefresh} disabled>
              <span className="button-icon">🔄</span>
              <span className="button-text">Refreshing...</span>
            </button>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your personalized news...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="home-page">
        <div className="page-header">
          <h1>Your Personalized News Feed</h1>
          <div className="header-actions">
            <button className="refresh-button" onClick={handleRefresh}>
              <span className="button-icon">🔄</span>
              <span className="button-text">Try Again</span>
            </button>
          </div>
        </div>
        <div className="error-container">
          <p>Error loading news: {error.message}</p>
          <Link to="/preferences" className="cta-button">Update Preferences</Link>
        </div>
      </div>
    );
  }

  // Check if we have articles
  const articles = data?.topStoriesAcrossCategories?.articles || [];
  const errors = data?.topStoriesAcrossCategories?.errors || [];

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>For You</h1>
        <div className="header-actions">
          <button 
            className="view-mode-button" 
            onClick={toggleViewMode}
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? '📋' : '📊'}
          </button>
          <button className="refresh-button" onClick={handleRefresh}>
            <span className="button-icon">🔄</span>
            <span className="button-text">Refresh</span>
          </button>
        </div>
      </div>

      {errors && errors.length > 0 && (
        <div className="api-errors">
          <p>Some news sources encountered errors:</p>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error.source}: {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {articles.length > 0 ? (
        <>
          <div className="selected-categories">
            <p>Showing news for: {selectedCategories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)).join(', ')}</p>
          </div>
          <NewsGrid articles={articles} viewMode={viewMode} />
        </>
      ) : (
        <div className="no-articles">
          <p>No articles found for your selected categories and locations.</p>
          <Link to="/preferences" className="cta-button">Update Preferences</Link>
        </div>
      )}
    </div>
  );
}

export default HomePage;