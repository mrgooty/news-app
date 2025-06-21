import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching news by category
export const fetchNewsByCategory = createAsyncThunk(
  'newsData/fetchNewsByCategory',
  async ({ category, location }, { getState, rejectWithValue }) => {
    try {
      // Check cache first
      const state = getState();
      const cachedData = state.newsData.cache[`${category}-${location}`];
      const cacheTime = state.newsData.cacheTime[`${category}-${location}`];
      
      // Cache for 5 minutes
      if (cachedData && cacheTime && Date.now() - cacheTime < 5 * 60 * 1000) {
        return { category, location, articles: cachedData, fromCache: true };
      }

      // Fetch from API
      const response = await fetch(`/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetNewsByCategory($category: String!, $location: String) {
              newsByCategory(category: $category, location: $location) {
                id
                title
                description
                url
                imageUrl
                source
                publishedAt
                category
              }
            }
          `,
          variables: { category, location },
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return {
        category,
        location,
        articles: data.data.newsByCategory || [],
        fromCache: false,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching all news for home page
export const fetchAllNews = createAsyncThunk(
  'newsData/fetchAllNews',
  async ({ categories, location }, { dispatch, rejectWithValue }) => {
    try {
      const promises = categories.map(category =>
        dispatch(fetchNewsByCategory({ category, location })).unwrap()
      );
      
      const results = await Promise.all(promises);
      
      // Combine all articles and remove duplicates
      const allArticles = results.flatMap(result => result.articles);
      const uniqueArticles = Array.from(
        new Map(allArticles.map(article => [article.url, article])).values()
      );
      
      // Sort by published date
      uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      return uniqueArticles;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const newsDataSlice = createSlice({
  name: 'newsData',
  initialState: {
    articles: [],
    cache: {},
    cacheTime: {},
    loading: false,
    error: null,
    lastFetch: null,
  },
  reducers: {
    clearCache: (state) => {
      state.cache = {};
      state.cacheTime = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    setArticles: (state, action) => {
      state.articles = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNewsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.articles = [];
      })
      .addCase(fetchNewsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        const { category, location, articles, fromCache } = action.payload;
        
        if (!fromCache) {
          // Update cache
          state.cache[`${category}-${location}`] = articles;
          state.cacheTime[`${category}-${location}`] = Date.now();
        }
        
        // Always update articles with the fetched data for the category
        state.articles = articles;
      })
      .addCase(fetchNewsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchAllNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCache, clearError, setArticles } = newsDataSlice.actions;

export default newsDataSlice.reducer; 