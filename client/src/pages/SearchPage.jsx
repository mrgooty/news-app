import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useUserPreferences } from '../hooks/usePrefs';
import { SEARCH_ARTICLES } from '../graphql/queries';
import NewsGrid from '../components/NewsGrid';
import NewsDetailModal from '../components/NewsDetailModal';
import '../styles/news-views.css';
import '../styles/components/status-indicators.css';

function useQueryString() {
  return new URLSearchParams(useLocation().search);
}

function SearchPage() {
  const queryString = useQueryString();
  const { location, isLoaded } = useUserPreferences();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const keyword = queryString.get('q') || '';
  const articlesPerPage = 20;

  const [searchNews, { loading, error, data, called, fetchMore }] = useLazyQuery(SEARCH_ARTICLES, {
    variables: { keyword, location, first: articlesPerPage },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (keyword && isLoaded) {
      searchNews();
      setHasMore(true);
    }
  }, [keyword, isLoaded, searchNews]);

  const fetchMoreData = () => {
    if (!fetchMore || !data?.searchNews?.pageInfo?.hasNextPage) return;

    fetchMore({
      variables: {
        after: data.searchNews.pageInfo.endCursor
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult || fetchMoreResult.searchNews.edges.length === 0) {
          setHasMore(false);
          return prev;
        }
        
        const newArticles = fetchMoreResult.searchNews.edges.map(edge => edge.node);
        const existingArticles = prev.searchNews.edges.map(edge => edge.node);
        
        return Object.assign({}, prev, {
          searchNews: {
            ...prev.searchNews,
            edges: [...prev.searchNews.edges, ...fetchMoreResult.searchNews.edges],
            pageInfo: fetchMoreResult.searchNews.pageInfo
          }
        });
      }
    });
  };

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
  
    if (loading && (!data || !data.searchNews)) {
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

    const articles = data?.searchNews?.edges?.map(edge => edge.node) || [];

    if (articles.length === 0 && called && !loading) {
       return (
         <div className="status-container">
           <p>No articles found for "{keyword}".</p>
           <Link to="/" className="cta-button">
             Back to Home
           </Link>
         </div>
       );
    }

    return (
      <InfiniteScroll
        dataLength={articles.length}
        next={fetchMoreData}
        hasMore={hasMore && data?.searchNews?.pageInfo?.hasNextPage}
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
        <NewsGrid articles={articles} onArticleSelect={handleArticleSelect} />
      </InfiniteScroll>
    );
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