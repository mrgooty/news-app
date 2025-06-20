import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_PREFERENCES_DATA } from './graphql/queries';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import PreferencesPage from './pages/PreferencesPage';
import NotFoundPage from './pages/NotFoundPage';
import TabNavigation from './components/TabNavigation';
import { useUserPreferences } from './hooks/usePrefs';

function AppContent() {
  const { isLoaded } = useUserPreferences();
  const { data, loading, error } = useQuery(GET_PREFERENCES_DATA);

  if (!isLoaded || loading) {
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
  return (
    <Router>
      <div className="app-container">
        <Header />
        <AppContent />
        <Footer />
      </div>
    </Router>
  );
}

export default App;