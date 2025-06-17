import { useState, useEffect } from 'react';
import { ANALYSIS_API_URL } from '../constants';

function NewsCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(article.summary);
  const [sentiment, setSentiment] = useState(article.sentiment);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  
  // Format the published date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    
    // If it's today, show time only
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', {
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

  // Get sentiment class
  const getSentimentClass = () => {
    if (!sentiment) return 'neutral';
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) return 'positive';
    if (lowerSentiment.includes('negative')) return 'negative';
    return 'neutral';
  };

  // Fetch article analysis if needed
  useEffect(() => {
    if (showSummary && (!summary || !sentiment) && !loading) {
      setLoading(true);
      fetch(ANALYSIS_API_URL, {
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

  // Toggle reading mode
  const toggleReadingMode = () => {
    setReadingMode(!readingMode);
    if (!readingMode) {
      // When entering reading mode, also show summary
      setShowSummary(true);
      setExpanded(true);
    }
  };

  // If in reading mode, show a different layout
  if (readingMode) {
    return (
      <div className="reading-mode-container">
        <button className="close-reading-mode" onClick={toggleReadingMode}>
          ← Back
        </button>
        
        <div className="reading-mode-header">
          <h2 className="reading-mode-title">{article.title}</h2>
          <div className="reading-mode-meta">
            <span className="reading-mode-source">{article.source}</span>
            <span className="reading-mode-date">{formatDate(article.publishedAt)}</span>
          </div>
        </div>
        
        {article.imageUrl && (
          <div className="reading-mode-image">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              onError={handleImageError}
            />
          </div>
        )}
        
        {summary && (
          <div className="reading-mode-summary">
            <h3>Summary</h3>
            <p>{summary}</p>
          </div>
        )}
        
        <div className="reading-mode-content">
          <p>{article.content || article.description}</p>
        </div>
        
        <div className="reading-mode-footer">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="reading-mode-link"
          >
            Read full article on {article.source}
          </a>
        </div>
      </div>
    );
  }

  // Regular card view
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
          <a href="#" onClick={(e) => { e.preventDefault(); toggleReadingMode(); }}>
            {article.title}
          </a>
        </h3>

        <p className="news-description">
          {expanded ? article.description : article.description?.substring(0, 150)}
          {!expanded && article.description && article.description.length > 150 && '...'}
        </p>

        <div className="news-actions">
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
        </div>

        {showSummary && loading && (
          <div className="loading">Generating summary...</div>
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
          <div className={`sentiment-indicator ${getSentimentClass()}`}>
            {sentiment}
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsCard;