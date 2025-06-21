import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PREFERENCES_DATA } from './graphql/queries';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loadPreferences } from './store/slices/userPreferencesSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import PreferencesPage from './pages/PreferencesPage';
import NotFoundPage from './pages/NotFoundPage';
import TabNavigation from './components/TabNavigation';
import NewsDetailModal from './components/NewsDetailModal';

function AppContent() {
  const dispatch = useAppDispatch();
  const { isLoaded, loading } = useAppSelector((state) => state.userPreferences);
  const { data, loading: queryLoading, error } = useQuery(GET_PREFERENCES_DATA);

  // Load preferences on component mount
  useEffect(() => {
    dispatch(loadPreferences());
  }, [dispatch]);

  if (!isLoaded || loading || queryLoading) {
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

  return (
    <main className="main-content">
      <TabNavigation categories={allCategories} />
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </main>
  );
}

function App() {
  const { darkMode } = useAppSelector((state) => state.userPreferences);

  useEffect(() => {
    const body = document.body;
    if (darkMode) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }, [darkMode]);

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