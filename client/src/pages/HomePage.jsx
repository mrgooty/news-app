import React, { useState, useEffect, useCallback } from 'react';
import { useUserPreferences } from '../hooks/usePrefs';
import { useLazyQuery } from '@apollo/client';
import { GET_NEWS_BY_CATEGORY } from '../graphql/queries';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import { Link } from 'react-router-dom';
import '../styles/news-views.css';
import '../styles/HomePage.css';

function HomePage() {
  const { selectedCategories, location, isLoaded } = useUserPreferences();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const [getNews, { loading: queryLoading, error: queryError }] = useLazyQuery(GET_NEWS_BY_CATEGORY);

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    let categoriesToFetch = selectedCategories.length > 0 ? selectedCategories : ['general'];

    try {
      const fetchPromises = categoriesToFetch.map(category =>
        getNews({ variables: { category, location } })
      );
      
      const results = await Promise.all(fetchPromises);
      
      const allArticles = results.flatMap(result => {
        if (result.error) {
          console.error(`Error fetching news for a category:`, result.error);
          return []; // Skip this category on error
        }
        return result.data?.newsByCategory || [];
      });
      
      const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.url, a])).values());
      uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      setArticles(uniqueArticles);
    } catch (err) {
      console.error('An unexpected error occurred during news fetching:', err);
      setError('Failed to fetch news. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategories, location, getNews]);

  useEffect(() => {
    if (isLoaded) {
      fetchNews();
    }
  }, [isLoaded, fetchNews]);

  const renderContent = () => {
    if ((!isLoaded || loading) && articles.length === 0) {
      return (
        <div className="status-container">
          <div className="spinner"></div>
          <p>Loading news...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="status-container">
          <p className="error-message">Could not load your feed.</p>
          <p className="error-details">{error}</p>
          <button onClick={fetchNews} className="try-again-button">
            Try Again
          </button>
        </div>
      );
    }

    if (articles.length === 0) {
      return (
         <div className="status-container">
           <p>No articles found for your selected categories.</p>
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
      <div className="home-header">
        <h1 className="view-title">
          {selectedCategories.length === 0 ? 'Top Stories' : 'For You'}
        </h1>
        {selectedCategories.length === 0 && isLoaded && (
          <div className="onboarding-message">
            <p>Get a personalized feed by selecting your favorite topics.</p>
            <Link to="/preferences" className="cta-button">
              Customize Feed
            </Link>
          </div>
        )}
      </div>
      {renderContent()}
      <NewsDetailModal article={selectedArticle} onClose={handleCloseModal} />
    </div>
  );
}

export default HomePage;