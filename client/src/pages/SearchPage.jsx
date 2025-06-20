import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { useUserPreferences } from '../hooks/usePrefs';
import { SEARCH_NEWS } from '../graphql/queries';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import '../styles/news-views.css';

function useQueryString() {
  return new URLSearchParams(useLocation().search);
}

function SearchPage() {
  const queryString = useQueryString();
  const { location, isLoaded } = useUserPreferences();
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const keyword = queryString.get('q') || '';

  const [searchNews, { loading, error, data, called }] = useLazyQuery(SEARCH_NEWS, {
    variables: { keyword, location }
  });

  useEffect(() => {
    if (keyword && isLoaded) {
      searchNews();
    }
  }, [keyword, isLoaded, searchNews]);

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  const renderContent = () => {
    if (!called && !loading) {
        return <div className="status-container"><p>Enter a term above to search for news.</p></div>;
    }
  
    if (loading) {
      return (
        <div className="status-container">
          <div className="spinner"></div>
          <p>Searching for articles about "{keyword}"...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="status-container">
          <p className="error-message">Could not perform search.</p>
          <p className="error-details">{error.message}</p>
        </div>
      );
    }

    const articles = data?.searchNews || [];

    if (articles.length === 0 && called) {
      return (
         <div className="status-container">
           <p>No articles found for "{keyword}".</p>
           <Link to="/" className="cta-button">
             Back to Home
           </Link>
         </div>
      );
    }

    return <NewsGrid articles={articles} onArticleSelect={handleArticleSelect} />;
  }

  return (
    <div className="news-view">
      <h1 className="view-title">Search Results</h1>
      <p className="search-intro">
        {keyword ? `Showing results for: ` : 'Search for something in the header.'}
        {keyword && <span className="search-keyword">{keyword}</span>}
      </p>
      {renderContent()}
      <NewsDetailModal article={selectedArticle} onClose={handleCloseModal} />
    </div>
  );
}

export default SearchPage;