import React from 'react';
import { useArticleAnalysis } from '../hooks/useArticleAnalysis';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faMeh, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const sentimentIcons = {
  POSITIVE: { icon: faThumbsUp, color: 'var(--success-color)' },
  NEGATIVE: { icon: faThumbsDown, color: 'var(--error-color)' },
  NEUTRAL: { icon: faMeh, color: 'var(--text-muted-color)' },
  default: { icon: faExclamationCircle, color: 'var(--warning-color)' },
};

const getSentimentIcon = (sentiment) => {
  const label = sentiment?.label?.toUpperCase();
  return sentimentIcons[label] || sentimentIcons.default;
};

const ArticleAnalysis = ({ articleUrl }) => {
  const { analysis, isLoading, error, analyzeArticle } = useArticleAnalysis();

  const handleAnalyzeClick = () => {
    analyzeArticle(articleUrl);
  };

  return (
    <div className="article-analysis-container">
      <button onClick={handleAnalyzeClick} disabled={isLoading} className="summarize-button">
        {isLoading ? 'Analyzing...' : 'Analyze Article'}
      </button>

      {isLoading && <div className="spinner" aria-label="Loading analysis"></div>}
      
      {error && <div className="error-message analysis-error">{error}</div>}
      
      {analysis && (
        <div className="analysis-result">
          <h3>Analysis</h3>
          <div className="sentiment-display">
            <FontAwesomeIcon
              icon={getSentimentIcon(analysis.sentiment).icon}
              style={{ color: getSentimentIcon(analysis.sentiment).color }}
            />
            <strong style={{ color: getSentimentIcon(analysis.sentiment).color, marginLeft: '8px' }}>
              {analysis.sentiment.label}
            </strong>
          </div>
          <p>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
};

export default ArticleAnalysis; 