import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchAllNews } from '../store/slices/newsDataSlice';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import '../styles/news-views.css';
import '../styles/HomePage.css';

function HomePage() {
  const dispatch = useAppDispatch();
  const { selectedCategories, location, isLoaded } = useAppSelector((state) => state.userPreferences);
  const { articles, loading, error } = useAppSelector((state) => state.newsData);

  useEffect(() => {
    if (isLoaded && selectedCategories.length > 0) {
      dispatch(fetchAllNews({ categories: selectedCategories, location }));
    }
  }, [dispatch, isLoaded, selectedCategories, location]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="status-container">
          <div className="spinner"></div>
          <p>Loading your personalized news feed...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="status-container">
          <p className="error-message">Could not load your feed.</p>
          <p className="error-details">{error}</p>
          <button 
            onClick={() => dispatch(fetchAllNews({ categories: selectedCategories, location }))} 
            className="try-again-button"
          >
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

    return <NewsGrid articles={articles} />;
  };

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
      <NewsDetailModal />
    </div>
  );
}

export default HomePage;