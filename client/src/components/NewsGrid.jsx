import NewsCard from './NewsCard';

function NewsGrid({ articles }) {
  if (!articles || articles.length === 0) {
    return <div className="no-articles">No articles available.</div>;
  }

  return (
    <div className="news-grid">
      {articles.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}

export default NewsGrid;