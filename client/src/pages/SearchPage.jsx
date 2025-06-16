import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import NewsGrid from '../components/NewsGrid';

// GraphQL query to search articles
const SEARCH_ARTICLES = gql`
  query SearchArticles($query: String!, $limit: Int) {
    searchArticles(query: $query, limit: $limit) {
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

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  const [searchArticles, { loading, error, data }] = useLazyQuery(SEARCH_ARTICLES);
  
  // Execute search if there's an initial query from URL
  useState(() => {
    if (initialQuery) {
      searchArticles({ variables: { query: initialQuery, limit: 20 } });
    }
  }, [initialQuery, searchArticles]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      searchArticles({ variables: { query: searchQuery, limit: 20 } });
    }
  };

  return (
    <div className="search-page">
      <h1>Search News</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for news..."
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
      
      {loading && <div className="loading">Searching...</div>}
      {error && <div className="error">Error: {error.message}</div>}
      
      {data && data.searchArticles && (
        <>
          <h2>Search Results for "{initialQuery}"</h2>
          {data.searchArticles.length > 0 ? (
            <NewsGrid articles={data.searchArticles} />
          ) : (
            <div className="no-results">No articles found for your search.</div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchPage;