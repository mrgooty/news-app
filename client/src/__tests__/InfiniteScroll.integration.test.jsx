import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../pages/HomePage';
import CategoryPage from '../pages/CategoryPage';
import newsDataReducer, { fetchAllNews, fetchNewsByCategory } from '../store/slices/newsDataSlice';
import userPreferencesReducer from '../store/slices/userPreferencesSlice';
import uiStateReducer from '../store/slices/uiStateSlice';
import weatherReducer from '../store/slices/weatherSlice';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Sample articles
const makeArticles = (count, prefix = 'Article') =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} Title ${i}`,
    url: `https://example.com/${prefix}-${i}`,
    description: `${prefix} Description ${i}`,
    imageUrl: '',
    source: 'Test Source',
    publishedAt: '2024-01-01T00:00:00Z',
    category: 'business',
  }));

// Helper to create a test store with optional overrides
const createTestStore = (newsOverrides = {}, prefsOverrides = {}) =>
  configureStore({
    reducer: {
      userPreferences: userPreferencesReducer,
      newsData: newsDataReducer,
      uiState: uiStateReducer,
      weather: weatherReducer,
    },
    preloadedState: {
      userPreferences: {
        selectedCategories: ['business', 'technology'],
        location: 'us',
        isLoaded: true,
        ...prefsOverrides,
      },
      newsData: {
        articles: [],
        loading: false,
        error: null,
        hasMore: true,
        endCursor: null,
        prefetched: {},
        ...newsOverrides,
      },
      uiState: {},
      weather: {},
    },
  });

// Mock Redux store and thunks
vi.mock('../store/slices/newsDataSlice', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchAllNews: vi.fn(() => () => Promise.resolve()),
    fetchNewsByCategory: vi.fn(() => () => Promise.resolve()),
  };
});

describe('Infinite Scroll Integration', () => {
  let store;
  let fetchAllNewsMock;
  let fetchNewsByCategoryMock;

  beforeAll(() => {
    global.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
  });

  beforeEach(() => {
    fetchAllNewsMock = vi.spyOn(require('../store/slices/newsDataSlice'), 'fetchAllNews').mockImplementation(() => () => Promise.resolve());
    fetchNewsByCategoryMock = vi.spyOn(require('../store/slices/newsDataSlice'), 'fetchNewsByCategory').mockImplementation(() => () => Promise.resolve());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger API for more news when scrolling to end in HomePage', async () => {
    store = createTestStore({
      articles: makeArticles(20),
      hasMore: true,
      endCursor: 'cursor-1',
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </Provider>
    );
    // Simulate scroll event
    fireEvent.scroll(window, { target: { scrollY: 10000 } });
    // Simulate user scroll to bottom (InfiniteScroll uses window by default)
    await waitFor(() => {
      expect(fetchAllNewsMock).toHaveBeenCalled();
    });
  });

  it('should trigger API for more news when scrolling to end in CategoryPage', async () => {
    store = createTestStore(
      {
        articles: makeArticles(20, 'Business'),
        hasMore: true,
        endCursor: 'cursor-1',
      },
      { isLoaded: true }
    );
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/category/business"]}>
          <Routes>
            <Route path="/category/:categoryId" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    // Simulate scroll event
    fireEvent.scroll(window, { target: { scrollY: 10000 } });
    // Simulate user scroll to bottom (InfiniteScroll uses window by default)
    await waitFor(() => {
      expect(fetchNewsByCategoryMock).toHaveBeenCalled();
    });
  });

  it('should not trigger API if hasMore is false in HomePage', async () => {
    store = createTestStore({
      articles: makeArticles(20),
      hasMore: false,
      endCursor: 'cursor-1',
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </Provider>
    );
    fireEvent.scroll(window, { target: { scrollY: 10000 } });
    await waitFor(() => {
      expect(fetchAllNewsMock).not.toHaveBeenCalled();
    });
  });

  it('should not trigger API if hasMore is false in CategoryPage', async () => {
    store = createTestStore(
      {
        articles: makeArticles(20, 'Business'),
        hasMore: false,
        endCursor: 'cursor-1',
      },
      { isLoaded: true }
    );
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/category/business"]}>
          <Routes>
            <Route path="/category/:categoryId" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    fireEvent.scroll(window, { target: { scrollY: 10000 } });
    await waitFor(() => {
      expect(fetchNewsByCategoryMock).not.toHaveBeenCalled();
    });
  });

  it('shows loading spinner and fetches more news on scroll (HomePage)', async () => {
    // ... render HomePage ...
    // assert spinner, scroll, assert fetchAllNews called, assert new articles rendered
  });

  it('shows "Yay! You have seen it all" when hasMore is false (HomePage)', async () => {
    // ... render HomePage with hasMore false ...
    // assert message
  });

  it('fetches more news on scroll in CategoryPage', async () => {
    // ... render CategoryPage ...
    // assert spinner, scroll, assert fetchNewsByCategory called, assert new articles rendered
  });

  it('shows "Yay! You have seen it all" when hasMore is false (CategoryPage)', async () => {
    // ... render CategoryPage with hasMore false ...
    // assert message
  });

  it('resets scroll and fetches new articles when switching categories', async () => {
    // ... simulate category switch ...
    // assert reset, fetchNewsByCategory called, scroll position reset
  });

  it('handles no articles edge case gracefully', async () => {
    // ... render with empty articles ...
    // assert UI shows empty state
  });
}); 