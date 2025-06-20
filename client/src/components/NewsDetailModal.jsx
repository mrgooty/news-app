import React, { useState, useEffect } from 'react';
import '../styles/news-views.css'; 

const NewsDetailModal = ({ article, onClose }) => {
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Close modal on 'Escape' key press for accessibility
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Reset state when a new article is selected
  useEffect(() => {
    setSummary('');
    setSummaryError('');
    setIsLoadingSummary(false);
  }, [article]);

  if (!article) {
    return null;
  }

  // Prevents the modal from closing when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleSummarize = async () => {
    if (!article.url) {
      setSummaryError('Article URL not available to summarize.');
      return;
    }

    setIsLoadingSummary(true);
    setSummary('');
    setSummaryError('');
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: article.url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to retrieve summary.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryError(error.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  const publishedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleString() 
    : 'Not available';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 id="modal-title" className="modal-title">{article.title}</h2>
        <div className="modal-meta">
          <span className="modal-source">{article.source}</span>
          <span className="modal-date">{publishedDate}</span>
        </div>
        {article.imageUrl && (
          <img src={article.imageUrl} alt="" className="modal-image" />
        )}
        <div className="modal-body">
          <p>{article.content || article.description || 'Full content not available.'}</p>
        </div>
        <div className="modal-footer">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="read-more-button"
          >
            Read Full Article
          </a>
          <button onClick={handleSummarize} disabled={isLoadingSummary} className="summarize-button">
            {isLoadingSummary ? 'Analyzing...' : 'Summarize'}
          </button>
        </div>

        {(summary || isLoadingSummary || summaryError) && (
          <div className="analysis-result">
            <h3>Summary</h3>
            {isLoadingSummary && <p>Loading summary...</p>}
            {summaryError && <div className="error-message analysis-error">{summaryError}</div>}
            {summary && <p>{summary}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetailModal; 