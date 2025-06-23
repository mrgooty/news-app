import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NewsCard from '../../components/NewsCard';
import uiStateSlice from '../../store/slices/uiStateSlice';
import { vi } from 'vitest';

// Mock the Redux store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      uiState: uiStateSlice
    },
    preloadedState: {
      uiState: {
        selectedArticle: null,
        isModalOpen: false,
        ...initialState
      }
    }
  });
};

// Test data
const mockArticle = {
  id: 'test-article-1',
  title: 'Test Article Title',
  description: 'This is a test article description that should be displayed in the card.',
  content: 'This is the full content of the test article.',
  url: 'https://example.com/test-article',
  imageUrl: 'https://example.com/test-image.jpg',
  source: 'Test Source',
  publishedAt: '2024-01-15T10:30:00Z',
  category: 'technology'
};

// Replace jest.fn() with vi.fn() for IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

describe('NewsCard Component', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  const renderWithProvider = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  describe('Rendering', () => {
    test('should render article title', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });

    test('should render article description', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByText('This is a test article description that should be displayed in the card.')).toBeInTheDocument();
    });

    test('should render article source', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByText('Test Source')).toBeInTheDocument();
    });

    test('should render article image when available', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const image = screen.getByAltText('Test Article Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    });

    test('should render placeholder image when imageUrl is not available', () => {
      const articleWithoutImage = { ...mockArticle, imageUrl: null };
      renderWithProvider(<NewsCard article={articleWithoutImage} />);
      
      const image = screen.getByAltText('Test Article Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/src/assets/placeholder-news.jpg');
    });

    test('should render formatted publication date', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      // The date should be formatted and displayed
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    test('should render category badge', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByText('technology')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should open modal when card is clicked', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      // Check if the article was selected in the store
      const state = store.getState();
      expect(state.uiState.selectedArticle).toEqual(mockArticle);
      expect(state.uiState.isModalOpen).toBe(true);
    });

    test('should open article in new tab when external link is clicked', () => {
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true
      });

      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const externalLink = screen.getByLabelText('Open article in new tab');
      fireEvent.click(externalLink);
      
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/test-article', '_blank');
    });

    test('should prevent event propagation when external link is clicked', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const card = screen.getByRole('button');
      const externalLink = screen.getByLabelText('Open article in new tab');
      
      // Mock event.stopPropagation
      const mockStopPropagation = jest.fn();
      const mockEvent = { stopPropagation: mockStopPropagation };
      
      fireEvent.click(externalLink, mockEvent);
      
      expect(mockStopPropagation).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByLabelText('Open article in new tab')).toBeInTheDocument();
    });

    test('should have proper button role', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should have proper alt text for images', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      expect(screen.getByAltText('Test Article Title')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing title gracefully', () => {
      const articleWithoutTitle = { ...mockArticle, title: null };
      renderWithProvider(<NewsCard article={articleWithoutTitle} />);
      
      expect(screen.getByText('No title available')).toBeInTheDocument();
    });

    test('should handle missing description gracefully', () => {
      const articleWithoutDescription = { ...mockArticle, description: null };
      renderWithProvider(<NewsCard article={articleWithoutDescription} />);
      
      // Should not crash and should render other content
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      expect(screen.getByText('Test Source')).toBeInTheDocument();
    });

    test('should handle missing source gracefully', () => {
      const articleWithoutSource = { ...mockArticle, source: null };
      renderWithProvider(<NewsCard article={articleWithoutSource} />);
      
      expect(screen.getByText('Unknown Source')).toBeInTheDocument();
    });

    test('should handle invalid date gracefully', () => {
      const articleWithInvalidDate = { ...mockArticle, publishedAt: 'invalid-date' };
      renderWithProvider(<NewsCard article={articleWithInvalidDate} />);
      
      // Should not crash and should render other content
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    });

    test('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      const articleWithLongTitle = { ...mockArticle, title: longTitle };
      renderWithProvider(<NewsCard article={articleWithLongTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(500);
      const articleWithLongDescription = { ...mockArticle, description: longDescription };
      renderWithProvider(<NewsCard article={articleWithLongDescription} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should use lazy loading for images', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const image = screen.getByAltText('Test Article Title');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    test('should handle image load errors gracefully', () => {
      renderWithProvider(<NewsCard article={mockArticle} />);
      
      const image = screen.getByAltText('Test Article Title');
      
      // Simulate image load error
      fireEvent.error(image);
      
      // Should fallback to placeholder
      expect(image).toHaveAttribute('src', '/src/assets/placeholder-news.jpg');
    });
  });
}); 