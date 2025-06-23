import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PREFERENCES_DATA } from './graphql/queries';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loadPreferences } from './store/slices/userPreferencesSlice';
import { loadWeatherPreferences } from './store/slices/weatherSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import PreferencesPage from './pages/PreferencesPage';
import NotFoundPage from './pages/NotFoundPage';
import LocalNews from './components/LocalNews';
import TabNavigation from './components/TabNavigation';
import NewsDetailModal from './components/NewsDetailModal';
import { useSelector } from 'react-redux';

function AppContent() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { selectedCategories, isLoaded: prefsLoaded, loading: prefsLoading } = useAppSelector((state) => state.userPreferences);
  const { isLoaded: weatherLoaded, loading: weatherLoading } = useAppSelector((state) => state.weather);
  const { data, loading: queryLoading, error } = useQuery(GET_PREFERENCES_DATA);

  // Load preferences on component mount
  useEffect(() => {
    dispatch(loadPreferences());
    dispatch(loadWeatherPreferences());
  }, [dispatch]);

  if (!prefsLoaded || !weatherLoaded || prefsLoading || weatherLoading || queryLoading) {
    return (
      <main className="main-content">
        <div className="status-container">
          <div className="spinner"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return <p>Error loading application data: {error.message}</p>;
  }

  const allCategories = data?.categories || [];
  const displayedCategories = allCategories.filter(cat => selectedCategories.includes(cat.id));

  const showTabNavigation = location.pathname === '/' || location.pathname.startsWith('/category');

  return (
    <main className="main-content">
      {showTabNavigation && (
        <TabNavigation
          categories={displayedCategories}
          selectedCategory={selectedCategories.length > 0 ? selectedCategories[0] : 'all'}
        />
      )}
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/local" element={<LocalNews />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </main>
  );
}

function App() {
  const isDarkMode = useSelector((state) => state.uiState.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="app-container">
        <Header />
        <AppContent />
        <Footer />
        <NewsDetailModal />
      </div>
    </Router>
  );
}

export default App; 