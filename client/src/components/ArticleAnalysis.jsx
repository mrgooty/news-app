import React from 'react';
import { useArticleAnalysis } from '../hooks/useArticleAnalysis';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faMeh, faExclamationCircle, faFlag, faUsers, faGlobe } from '@fortawesome/free-solid-svg-icons';
import '../styles/components/ArticleAnalysis.css';

const sentimentIcons = {
  POSITIVE: { icon: faThumbsUp, color: 'var(--success-color)' },
  NEGATIVE: { icon: faThumbsDown, color: 'var(--error-color)' },
  NEUTRAL: { icon: faMeh, color: 'var(--text-muted-color)' },
  default: { icon: faExclamationCircle, color: 'var(--warning-color)' },
};

const getSentimentIcon = (sentimentLabel = '') => {
  const label = sentimentLabel.toUpperCase();
  return sentimentIcons[label] || sentimentIcons.default;
};

const getSentimentColor = (score) => {
  if (score >= 0.6) return 'var(--success-color)';
  if (score <= 0.4) return 'var(--error-color)';
  return 'var(--warning-color)';
};

const SentimentSection = ({ title, icon, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="sentiment-section">
      <h4 className="sentiment-section-title">
        <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />
        {title}
      </h4>
      <div className="sentiment-items">
        {Object.entries(data).map(([key, sentimentData]) => (
          <div key={key} className="sentiment-item">
            <span className="sentiment-label">{key}:</span>
            {sentimentData && typeof sentimentData === 'object' ? (
              <span 
                className="sentiment-score"
                style={{ color: getSentimentColor(sentimentData.confidence) }}
              >
                {sentimentData.sentiment} ({(sentimentData.confidence * 100).toFixed(1)}%)
              </span>
            ) : (
              <span className="sentiment-text">{String(sentimentData)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ArticleAnalysis = ({ articleUrl }) => {
  const { analysis, isLoading, error, analyzeArticle } = useArticleAnalysis();

  const handleAnalyzeClick = () => {
    analyzeArticle(articleUrl);
  };

  const sentimentContainer = analysis?.sentimentAnalysis || {};
  const sentimentAnalysis = sentimentContainer?.sentimentAnalysis || {};
  const identifiedEntities = sentimentContainer?.identifiedEntities || {};
  
  const overallSentiment = sentimentAnalysis?.overallSentiment;
  const overallConfidence = sentimentAnalysis?.confidence;

  const partySentiment = sentimentAnalysis?.politicalParties || {};
  const countrySentiment = sentimentAnalysis?.countries || {};
  const demographicSentiment = sentimentAnalysis?.populationGroups || {};
  
  const recommendations = sentimentContainer?.summary?.recommendations || [];
  const analysisMetadata = sentimentContainer?.metadata || analysis?.metadata || {};

  return (
    <div className="article-analysis-container">
      <button onClick={handleAnalyzeClick} disabled={isLoading} className="summarize-button">
        {isLoading ? 'Analyzing...' : 'Analyze Article'}
      </button>

      {isLoading && <div className="spinner" aria-label="Loading analysis"></div>}
      
      {error && <div className="error-message analysis-error">{error}</div>}
      
      {analysis && (
        <div className="analysis-result">
          <h3>Comprehensive Analysis</h3>
          
          {/* Article Data */}
          {analysis.articleData && (
            <div className="analysis-summary">
              <h4>Article Information</h4>
              <p><strong>Title:</strong> {analysis.articleData.title}</p>
              <p><strong>Word Count:</strong> {analysis.articleData.wordCount}</p>
              <p><strong>Reading Time:</strong> {analysis.articleData.readingTime} minutes</p>
            </div>
          )}

          {/* Overall Sentiment */}
          {overallSentiment && (
            <div className="overall-sentiment">
              <h4>Overall Sentiment</h4>
              <div className="sentiment-display">
                <FontAwesomeIcon
                  icon={getSentimentIcon(overallSentiment).icon}
                  style={{ color: getSentimentIcon(overallSentiment).color }}
                />
                <strong style={{ color: getSentimentIcon(overallSentiment).color, marginLeft: '8px' }}>
                  {overallSentiment} ({typeof overallConfidence === 'number' ? (overallConfidence * 100).toFixed(1) : 'N/A'}%)
                </strong>
              </div>
            </div>
          )}

          {/* Political Party Analysis */}
          <SentimentSection 
            title="Political Party Sentiment" 
            icon={faFlag}
            data={partySentiment}
          />

          {/* Country Analysis */}
          <SentimentSection 
            title="Country-Specific Sentiment" 
            icon={faGlobe}
            data={countrySentiment}
          />

          {/* Demographic Analysis */}
          <SentimentSection 
            title="Demographic Group Sentiment" 
            icon={faUsers}
            data={demographicSentiment}
          />

          {/* Identified Entities */}
          {Object.keys(identifiedEntities).length > 0 && (
            <div className="identified-entities">
              <h4>Identified Entities</h4>
              <div className="entities-grid">
                {identifiedEntities.politicalParties?.length > 0 && (
                  <div className="entity-group">
                    <strong>Political Parties:</strong>
                    <span>{identifiedEntities.politicalParties.map(p => p.name).join(', ')}</span>
                  </div>
                )}
                {identifiedEntities.countries?.length > 0 && (
                  <div className="entity-group">
                    <strong>Countries:</strong>
                    <span>{identifiedEntities.countries.map(c => c.name).join(', ')}</span>
                  </div>
                )}
                {identifiedEntities.populationGroups?.length > 0 && (
                  <div className="entity-group">
                    <strong>Demographics:</strong>
                    <span>{identifiedEntities.populationGroups.map(d => d.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Analysis Recommendations</h4>
              <ul className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <li key={index} className="recommendation-item">{rec.recommendation} ({rec.priority})</li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis Metadata */}
          {analysisMetadata && (
            <div className="analysis-metadata">
              <small>
                Analysis completed at {new Date(analysisMetadata.timestamp).toLocaleString()}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleAnalysis; 