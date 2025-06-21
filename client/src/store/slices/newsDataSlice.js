import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client as apolloClient } from "../../graphql/client";
import { GET_ARTICLES_BY_CATEGORY, SEARCH_ARTICLES, GET_TOP_STORIES_ACROSS_CATEGORIES } from "../../graphql/queries";
import { deduplicateArticles } from "../../lib/utils.js";

const initialState = {
  articles: [],
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  prefetched: {},
};

const ARTICLE_LIMIT = 20;

export const fetchAllNews = createAsyncThunk(
  "news/fetchAllNews",
  async ({ categories, location, after = null }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_TOP_STORIES_ACROSS_CATEGORIES,
        variables: { categories, location, first: ARTICLE_LIMIT, after },
      });
      const articles = data.topStoriesAcrossCategories.edges.map(edge => edge.node);
      const pageInfo = data.topStoriesAcrossCategories.pageInfo;
      return { articles, pageInfo, endCursor: pageInfo.endCursor };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNewsByCategory = createAsyncThunk(
  "news/fetchNewsByCategory",
  async ({ category, location, after = null }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ARTICLES_BY_CATEGORY,
        variables: { category, location, first: ARTICLE_LIMIT, after },
      });
      const articles = data.newsByCategory.edges.map(edge => edge.node);
      const pageInfo = data.newsByCategory.pageInfo;
      return { articles, pageInfo, endCursor: pageInfo.endCursor };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchNews = createAsyncThunk(
  "news/searchNews",
  async ({ query, location, after = null }, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_ARTICLES,
        variables: { query, location, first: ARTICLE_LIMIT, after },
      });
      const articles = data.searchNews.edges.map(edge => edge.node);
      const pageInfo = data.searchNews.pageInfo;
      return { articles, pageInfo, endCursor: pageInfo.endCursor };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const prefetchCategory = createAsyncThunk(
  "news/prefetchCategory",
  async ({ category, location }, { getState, rejectWithValue, dispatch }) => {
    const state = getState();
    const { newsData, uiState } = state;
    if (uiState.activeTab === category || newsData.prefetched[category] || newsData.loading) {
      return;
    }
    try {
      dispatch(newsDataSlice.actions.markAsPrefetching(category));
      await apolloClient.query({
        query: GET_ARTICLES_BY_CATEGORY,
        variables: { category, location, first: ARTICLE_LIMIT, after: null },
      });
      return { category };
    } catch (error) {
      return rejectWithValue({ category, error: error.message });
    }
  }
);

const newsDataSlice = createSlice({
  name: "newsData",
  initialState,
  reducers: {
    resetNews: (state) => {
      state.articles = [];
      state.hasMore = true;
      state.endCursor = null;
      state.error = null;
    },
    markAsPrefetching: (state, action) => {
      state.prefetched[action.payload] = true;
    },
  },
  extraReducers: (builder) => {
    [fetchAllNews, fetchNewsByCategory, searchNews].forEach(thunk => {
      builder
        .addCase(thunk.pending, (state, action) => {
          if (!action.meta.arg.after) {
            state.articles = [];
            state.hasMore = true;
            state.endCursor = null;
          }
          state.loading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          const newArticles = action.payload.articles;
          if (action.meta.arg.after) {
            state.articles = deduplicateArticles([...state.articles, ...newArticles]);
          } else {
            state.articles = newArticles;
          }
          state.hasMore = action.payload.pageInfo.hasNextPage;
          state.endCursor = action.payload.endCursor;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    });
    builder
      .addCase(prefetchCategory.fulfilled, (state, action) => {
        if (action.payload && action.payload.category) {
          state.prefetched[action.payload.category] = true;
        }
      })
      .addCase(prefetchCategory.rejected, (state, action) => {
        if (action.payload && action.payload.category) {
          state.prefetched[action.payload.category] = false;
        }
      });
  },
});

export const { resetNews, markAsPrefetching } = newsDataSlice.actions;

export default newsDataSlice.reducer;

