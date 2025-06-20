import React from 'react';
import NewsCard from './NewsCard';

function NewsGrid({ articles, onArticleSelect }) {
  if (!articles || articles.length === 0) {
    return <div className="no-articles">No articles available.</div>;
  }

  return (
    <div className="news-grid">
      {articles.map((article, index) => (
        <NewsCard 
          key={article.url || index} 
          article={article} 
          onArticleSelect={onArticleSelect} 
        />
      ))}
    </div>
  );
}

export default NewsGrid;