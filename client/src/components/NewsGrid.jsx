import NewsCard from './NewsCard';

function NewsGrid({ articles, viewMode = 'grid' }) {
  if (!articles || articles.length === 0) {
    return <div className="no-articles">No articles available.</div>;
  }

  return (
    <div className={`news-container ${viewMode === 'grid' ? 'news-grid' : 'news-list'}`}>
      {articles.map(article => (
        <NewsCard key={article.id} article={article} viewMode={viewMode} />
      ))}
    </div>
  );
}

export default NewsGrid;