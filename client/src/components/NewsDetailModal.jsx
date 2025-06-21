import React, { memo, useCallback, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { closeArticleModal } from '../store/slices/uiStateSlice';
import '../styles/components/NewsDetailModal.css';
import placeholderImage from '../assets/placeholder-news.jpg';
import ArticleAnalysis from './ArticleAnalysis';

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NewsDetailModal = memo(() => {
  const dispatch = useAppDispatch();
  const { isModalOpen, selectedArticle } = useAppSelector((state) => state.uiState);
  
  const [imgSrc, setImgSrc] = useState(null);

  const handleClose = useCallback(() => {
    dispatch(closeArticleModal());
  }, [dispatch]);

  // Effect to handle body scroll and keydown listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, handleClose]);
  
  // Effect to set image source when a new article is selected
  useEffect(() => {
    if (selectedArticle) {
      setImgSrc(selectedArticle.imageUrl || placeholderImage);
    }
  }, [selectedArticle]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isModalOpen || !selectedArticle) {
    return null;
  }

  const sourceName = (typeof selectedArticle.source === 'object' ? selectedArticle.source?.name : selectedArticle.source) || 'Unknown Source';

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={handleClose} aria-label="Close modal">×</button>
        
        <div className="modal-header">
          <h2 className="modal-title">{selectedArticle?.title || 'No title available'}</h2>
          <div className="modal-meta">
            <span className="modal-source">{sourceName}</span>
            <span className="modal-date">{formatDate(selectedArticle?.publishedAt)}</span>
            {selectedArticle?.category && <span className="modal-category">{selectedArticle.category}</span>}
          </div>
        </div>
        
        {imgSrc && (
          <div className="modal-image-container">
            <img
              src={imgSrc}
              alt={selectedArticle?.title || ''}
              className="modal-image"
              loading="lazy"
              onError={() => setImgSrc(placeholderImage)}
            />
          </div>
        )}
        
        <div className="modal-body">
          <p className="modal-description">{selectedArticle?.description || 'No description available.'}</p>
          {selectedArticle?.content && (
            <div className="modal-content-text">
              {selectedArticle.content}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <a href={selectedArticle?.url} target="_blank" rel="noopener noreferrer" className="modal-read-more">
            Read Full Article
          </a>
          <ArticleAnalysis articleUrl={selectedArticle?.url} />
        </div>
      </div>
    </div>
  );
});

NewsDetailModal.displayName = 'NewsDetailModal';

export default NewsDetailModal; 