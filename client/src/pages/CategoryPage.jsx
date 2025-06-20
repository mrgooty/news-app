import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useUserPreferences } from '../hooks/usePrefs';
import { GET_NEWS_BY_CATEGORY } from '../graphql/queries';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import '../styles/news-views.css';

function CategoryPage() {
  const { categoryId } = useParams();
  const { location, isLoaded } = useUserPreferences();
  const [selectedArticle, setSelectedArticle] = useState(null);

  const { loading, error, data, refetch } = useQuery(GET_NEWS_BY_CATEGORY, {
    variables: { category: categoryId, location },
    skip: !isLoaded,
    fetchPolicy: 'cache-and-network',
  });
  
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

  const renderContent = () => {
    if ((!isLoaded || loading) && !data) {
      return (
        <div className="status-container">
          <div className="spinner"></div>
          <p>Loading {categoryName} news...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="status-container">
          <p className="error-message">Could not load news for {categoryName}.</p>
          <p className="error-details">{error.message}</p>
          <button onClick={() => refetch()} className="try-again-button">
            Try Again
          </button>
        </div>
      );
    }

    const articles = data?.newsByCategory || [];

    if (articles.length === 0) {
      return (
         <div className="status-container">
           <p>No articles found for {categoryName}.</p>
           <Link to="/preferences" className="cta-button">
             Select Different Categories
           </Link>
         </div>
      );
    }

    return <NewsGrid articles={articles} onArticleSelect={handleArticleSelect} />;
  }

  return (
    <div className="news-view">
      <div className="page-header">
        <h1 className="view-title">{categoryName}</h1>
        <div className="header-controls">
          <button onClick={() => refetch()} disabled={loading} className="refresh-button">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      {renderContent()}
      <NewsDetailModal article={selectedArticle} onClose={handleCloseModal} />
    </div>
  );
}

export default CategoryPage;