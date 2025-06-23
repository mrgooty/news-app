import React, { memo, useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { openArticleModal } from '../store/slices/uiStateSlice';
import '../styles/components/NewsCard.css';
import placeholderImage from '../assets/placeholder-news.jpg';

const NewsCard = memo(({ article }) => {
  const dispatch = useAppDispatch();
  const [imgSrc, setImgSrc] = useState(article.imageUrl || placeholderImage);

  // When the article prop changes, reset the image source.
  useEffect(() => {
    setImgSrc(article.imageUrl || placeholderImage);
  }, [article.imageUrl]);

  const handleCardClick = () => {
    dispatch(openArticleModal(article));
  };

  const handleImageError = () => {
    setImgSrc(placeholderImage);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="news-card" onClick={handleCardClick}>
      <div className="news-image-container">
        <img
          src={imgSrc}
          alt={article?.title}
          className="news-image"
          loading="lazy"
          onError={handleImageError}
        />
      </div>
      <div className="news-content">
        <h3 className="news-title">
          <a href={article?.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {article?.title}
          </a>
        </h3>
        <p className="news-description">{article?.description}</p>
        <div className="news-footer">
          <button onClick={handleCardClick} className="read-more-link">
            Read More
          </button>
        </div>
      </div>
      <div className="news-meta">
        <span className="news-source">
          {(typeof article.source === 'object' ? article.source?.name : article.source) || 'Unknown Source'}
        </span>
        <span className="news-date">{formatDate(article?.publishedAt)}</span>
        {article?.category && <span className="news-category">{article.category}</span>}
      </div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;