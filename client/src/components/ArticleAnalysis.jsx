import React from "react";
import { useNavigate } from "react-router-dom";
import { useArticleAnalysis } from "../hooks/useArticleAnalysis";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faThumbsDown, faMeh, faExclamationCircle, faTags, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import "../styles/components/ArticleAnalysis.css";

const sentimentIcons = {
  POSITIVE: { icon: faThumbsUp, color: "var(--success-color)" },
  NEGATIVE: { icon: faThumbsDown, color: "var(--error-color)" },
  NEUTRAL: { icon: faMeh, color: "var(--text-muted-color)" },
  default: { icon: faExclamationCircle, color: "var(--warning-color)" },
};

const getSentimentIcon = (label = "") =>
  sentimentIcons[label.toUpperCase()] || sentimentIcons.default;

const ArticleAnalysis = ({ articleUrl }) => {
  const { analysis, isLoading, error, analyzeArticle } = useArticleAnalysis();
  const navigate = useNavigate();

  const sentimentLabel = analysis?.sentiment?.label;
  const confidence = analysis?.confidence;

  return (
    <div className="article-analysis-container">
      <button
        onClick={() => analyzeArticle(articleUrl)}
        disabled={isLoading}
        className="summarize-button"
      >
        {isLoading ? "Analyzing..." : "Analyze Article"}
      </button>

      {isLoading && <div className="spinner" aria-label="Loading analysis"></div>}

      {error && <div className="error-message analysis-error">{error}</div>}

      {analysis && (
        <div className="analysis-result">
          <h3>AI Analysis</h3>

          {analysis.summary && (
            <div className="analysis-summary">
              <h4>Summary</h4>
              <p>{analysis.summary}</p>
            </div>
          )}

          {sentimentLabel && (
            <div className="overall-sentiment">
              <h4>Sentiment</h4>
              <div className="sentiment-display">
                <FontAwesomeIcon
                  icon={getSentimentIcon(sentimentLabel).icon}
                  style={{ color: getSentimentIcon(sentimentLabel).color }}
                />
                <strong style={{ color: getSentimentIcon(sentimentLabel).color, marginLeft: "8px" }}>
                  {sentimentLabel}
                  {typeof confidence === "number" ? ` (${(confidence * 100).toFixed(1)}%)` : ""}
                </strong>
              </div>
              {analysis.sentimentLabel && <p>{analysis.sentimentLabel}</p>}
            </div>
          )}

          {analysis.keywords?.length > 0 && (
            <div className="identified-entities">
              <h4>
                <FontAwesomeIcon icon={faTags} style={{ marginRight: "8px" }} />
                Key Topics
              </h4>
              <div className="entities-grid">
                <span>{analysis.keywords.join(", ")}</span>
              </div>
            </div>
          )}

          {analysis.suggestions?.length > 0 && (
            <div className="recommendations">
              <h4>
                <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: "8px" }} />
                Explore Related
              </h4>
              <ul className="recommendations-list">
                {analysis.suggestions.map((s, index) => (
                  <li key={index} className="recommendation-item">
                    <button
                      className="suggestion-link"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleAnalysis;
