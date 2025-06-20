import React, { useState } from 'react';
import placeholderImage from '../assets/placeholder-news.jpg';

const NewsCard = ({ article, onArticleSelect }) => {
  const [imgSrc, setImgSrc] = useState(article.imageUrl || placeholderImage);

  const handleImageError = () => {
    setImgSrc(placeholderImage);
  };

  const handleCardClick = () => {
    if (onArticleSelect) {
      onArticleSelect(article);
    }
  };

  return (
    <article className="news-card" onClick={handleCardClick}>
      <div className="news-card-image-container">
        <img 
          src={imgSrc} 
          alt={article.title} 
          className="news-card-image"
          onError={handleImageError} 
        />
      </div>
      <div className="news-card-content">
        <h3 className="news-card-title">{article.title}</h3>
        <p className="news-card-source">
          <span>{article.source}</span>
          <span className="news-card-date">
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}
          </span>
        </p>
        <p className="news-card-description">{article.description}</p>
      </div>
    </article>
  );
};

export default NewsCard;