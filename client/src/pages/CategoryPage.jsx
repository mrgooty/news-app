import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchNewsByCategory } from '../store/slices/newsDataSlice';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import '../styles/news-views.css';
import '../styles/components/status-indicators.css';

function CategoryPage() {
  const { categoryId } = useParams();
  const dispatch = useAppDispatch();
  const { location, isLoaded } = useAppSelector((state) => state.userPreferences);
  const { articles, loading, error, hasMore, endCursor } = useAppSelector((state) => state.newsData);

  useEffect(() => {
    if (isLoaded && categoryId) {
      dispatch(fetchNewsByCategory({ category: categoryId, location }));
    }
  }, [dispatch, isLoaded, categoryId, location]);

  const fetchMoreData = () => {
    if (hasMore && !loading) {
      dispatch(fetchNewsByCategory({ category: categoryId, location, after: endCursor }));
    }
  };

  const handleRefresh = () => {
    dispatch(fetchNewsByCategory({ category: categoryId, location }));
  };

  const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

  const renderContent = () => {
    if ((!isLoaded || loading) && articles.length === 0) {
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
          <p className="error-details">{error}</p>
          <button onClick={handleRefresh} disabled={loading} className="try-again-button">
            {loading ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      );
    }

    if (articles.length === 0 && !loading) {
      return (
        <div className="status-container">
          <p>No articles found for {categoryName}.</p>
          <Link to="/preferences" className="cta-button">
            Select Different Categories
          </Link>
        </div>
      );
    }

    return (
      <InfiniteScroll
        dataLength={articles.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={
          <div className="status-container">
            <div className="spinner"></div>
            <p>Loading more articles...</p>
          </div>
        }
        endMessage={
          <p style={{ textAlign: 'center' }}>
            <b>Yay! You have seen it all</b>
          </p>
        }
      >
        <NewsGrid articles={articles} />
      </InfiniteScroll>
    );
  };

  return (
    <div className="news-view">
      <div className="page-header">
        <h1 className="view-title">{categoryName}</h1>
        <div className="header-controls">
          <button onClick={handleRefresh} disabled={loading} className="refresh-button">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      {renderContent()}
      <NewsDetailModal />
    </div>
  );
}

export default CategoryPage;