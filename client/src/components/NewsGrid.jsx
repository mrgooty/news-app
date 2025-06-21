import React, { memo } from 'react';
import NewsCard from './NewsCard';

const NewsGrid = memo(({ articles = [] }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="news-grid-empty">
        <p>No articles found.</p>
      </div>
    );
  }

  return (
    <div className="news-grid">
      {articles.map((article) => (
        <NewsCard key={article.id || article.url} article={article} />
      ))}
    </div>
  );
});

NewsGrid.displayName = 'NewsGrid';

export default NewsGrid;