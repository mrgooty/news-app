import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faMeh, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/news-views.css'; 

const NewsDetailModal = ({ article, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

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
    setAnalysis(null);
    setAnalysisError('');
    setIsLoadingAnalysis(false);
  }, [article]);

  if (!article) {
    return null;
  }

  // Prevents the modal from closing when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (!article.url) {
      setAnalysisError('Article URL not available to analyze.');
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysis(null);
    setAnalysisError('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: article.url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to retrieve analysis.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysisError(error.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };
  
  const getSentimentIcon = (sentiment) => {
    const label = sentiment?.label?.toUpperCase();
    switch (label) {
      case 'POSITIVE':
        return { icon: faThumbsUp, color: 'var(--success-color)' };
      case 'NEGATIVE':
        return { icon: faThumbsDown, color: 'var(--error-color)' };
      case 'NEUTRAL':
        return { icon: faMeh, color: 'var(--text-muted-color)' };
      default:
        return { icon: faExclamationCircle, color: 'var(--warning-color)' };
    }
  };

  const publishedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleString() 
    : 'Not available';
  
  const sentimentIcon = analysis?.sentiment ? getSentimentIcon(analysis.sentiment) : null;

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
          <button onClick={handleAnalyze} disabled={isLoadingAnalysis} className="summarize-button">
            {isLoadingAnalysis ? 'Analyzing...' : 'Analyze Article'}
          </button>
        </div>

        {(analysis || isLoadingAnalysis || analysisError) && (
          <div className="analysis-result">
            <h3>Analysis</h3>
            {isLoadingAnalysis && <p>Loading analysis...</p>}
            {analysisError && <div className="error-message analysis-error">{analysisError}</div>}
            {analysis && (
              <>
                {sentimentIcon && (
                  <div className="sentiment-display">
                    <FontAwesomeIcon icon={sentimentIcon.icon} style={{ color: sentimentIcon.color }} />
                    <strong style={{ color: sentimentIcon.color, marginLeft: '8px' }}>
                      {analysis.sentiment.label}
                    </strong>
                  </div>
                )}
                <p>{analysis.summary}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetailModal; 