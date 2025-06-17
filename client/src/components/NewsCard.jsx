import { useState, useEffect } from 'react';

function NewsCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(article.summary);
  const [sentiment, setSentiment] = useState(article.sentiment);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Format the published date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.src = '/placeholder-news.jpg';
    e.target.alt = 'News placeholder image';
  };

  useEffect(() => {
    if (showSummary && (!summary || !sentiment) && !loading) {
      setLoading(true);
      fetch('http://localhost:4000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: article.title, content: article.content || article.description })
      })
        .then(res => res.json())
        .then(data => {
          if (data.summary) setSummary(data.summary);
          if (data.sentiment) setSentiment(data.sentiment);
        })
        .catch(err => console.error('Error fetching analysis', err))
        .finally(() => setLoading(false));
    }
  }, [showSummary]);

  return (
    <div className={`news-card ${expanded ? 'expanded' : ''}`}>
      <div className="news-card-header">
        {article.imageUrl && (
          <div className="news-image-container">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="news-image"
              onError={handleImageError}
            />
          </div>
        )}
        <div className="news-meta">
          <span className="news-source">{article.source}</span>
          <span className="news-date">{formatDate(article.publishedAt)}</span>
          {article.category && <span className="news-category">{article.category}</span>}
          {article.location && <span className="news-location">{article.location}</span>}
        </div>
      </div>
      
      <div className="news-content">
        <h3 className="news-title">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h3>

        <p className="news-description">
          {expanded ? article.description : article.description?.substring(0, 150)}
          {!expanded && article.description && article.description.length > 150 && '...'}
        </p>

        {(article.description && article.description.length > 150) && (
          <button
            className="expand-button"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {expanded && (
          <button
            className="summarize-button"
            onClick={() => setShowSummary(prev => !prev)}
          >
            {showSummary ? 'Hide Summary' : 'Summarize'}
          </button>
        )}

        {showSummary && loading && (
          <div className="loading">Fetching from LangChain...</div>
        )}

        {showSummary && summary && (
          <div className="analysis-panel">
            <h4>Summary</h4>
            <p>{summary}</p>
          </div>
        )}
      </div>
      
      {expanded && article.entities && article.entities.length > 0 && (
        <div className="news-entities">
          <h4>Key Entities:</h4>
          <div className="entity-tags">
            {article.entities.map((entity, index) => (
              <span key={index} className="entity-tag">{entity}</span>
            ))}
          </div>
        </div>
      )}
      
      <div className="news-footer">
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="read-more-link"
        >
          Read full article
        </a>
        
        {sentiment && (
          <div className={`sentiment-indicator ${sentiment.toLowerCase()}`}>
            {sentiment}
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsCard;