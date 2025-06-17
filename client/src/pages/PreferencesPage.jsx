import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_CATEGORIES, GET_LOCATIONS } from '../graphql/queries';
import { useUserPreferences } from '../context/UserPreferencesContext';
import CategorySelection from '../components/CategorySelection';
import LocationSelection from '../components/LocationSelection';

function PreferencesPage() {
  const navigate = useNavigate();
  const { 
    selectedCategories, 
    categoryLocationPairs, 
    toggleCategory, 
    setCategoryLocation, 
    clearPreferences 
  } = useUserPreferences();
  
  const [activeTab, setActiveTab] = useState('categories');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialCategories, setInitialCategories] = useState([]);
  const [initialPairs, setInitialPairs] = useState({});
  
  // Fetch categories and locations
  const { loading: loadingCategories, data: categoriesData } = useQuery(GET_CATEGORIES);
  const { loading: loadingLocations, data: locationsData } = useQuery(GET_LOCATIONS);
  
  const categories = categoriesData?.categories || [];
  const locations = locationsData?.locations || [];
  
  // Store initial preferences to detect changes
  useEffect(() => {
    setInitialCategories([...selectedCategories]);
    setInitialPairs({...categoryLocationPairs});
  }, []);
  
  // Check for changes
  useEffect(() => {
    // Check if categories have changed
    const categoriesChanged = initialCategories.length !== selectedCategories.length || 
      initialCategories.some(cat => !selectedCategories.includes(cat)) ||
      selectedCategories.some(cat => !initialCategories.includes(cat));
    
    // Check if location pairs have changed
    let pairsChanged = false;
    const allCategoryIds = [...new Set([
      ...Object.keys(initialPairs), 
      ...Object.keys(categoryLocationPairs)
    ])];
    
    for (const catId of allCategoryIds) {
      if (initialPairs[catId] !== categoryLocationPairs[catId]) {
        pairsChanged = true;
        break;
      }
    }
    
    setHasChanges(categoriesChanged || pairsChanged);
  }, [selectedCategories, categoryLocationPairs]);
  
  // Handle save and navigate back
  const handleSave = () => {
    // In a real app, we might want to save to a server here
    navigate('/');
  };
  
  // Handle cancel and reset preferences
  const handleCancel = () => {
    // Reset to initial state
    navigate('/');
  };
  
  return (
    <div className="preferences-page">
      <div className="page-header">
        <h1>Customize Your News</h1>
        <div className="header-actions">
          {hasChanges && (
            <>
              <button className="save-button" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="preferences-tabs">
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>
      
      <div className="preferences-content">
        {activeTab === 'categories' && (
          <div className="categories-section">
            <p className="section-description">
              Select the news categories you're interested in. You can customize your news feed by selecting multiple categories.
            </p>
            
            {loadingCategories ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading categories...</p>
              </div>
            ) : (
              <CategorySelection 
                categories={categories} 
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
              />
            )}
          </div>
        )}
        
        {activeTab === 'locations' && (
          <div className="locations-section">
            <p className="section-description">
              Pair your selected categories with specific locations to get more relevant news.
            </p>
            
            {loadingLocations ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading locations...</p>
              </div>
            ) : (
              <LocationSelection 
                categories={categories.filter(cat => selectedCategories.includes(cat.id))}
                locations={locations}
                categoryLocationPairs={categoryLocationPairs}
                setCategoryLocation={setCategoryLocation}
              />
            )}
            
            {selectedCategories.length === 0 && (
              <div className="no-categories-selected">
                <p>Please select categories first to pair them with locations.</p>
                <button 
                  className="switch-tab-button"
                  onClick={() => setActiveTab('categories')}
                >
                  Select Categories
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'advanced' && (
          <div className="advanced-section">
            <div className="preferences-card">
              <h3>Reset Preferences</h3>
              <p>Clear all your selected categories and location pairings.</p>
              <button 
                className="danger-button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all preferences?')) {
                    clearPreferences();
                  }
                }}
              >
                Clear All Preferences
              </button>
            </div>
            
            <div className="preferences-card">
              <h3>News Sources</h3>
              <p>We aggregate news from multiple trusted sources to provide you with comprehensive coverage.</p>
              <ul className="sources-list">
                <li>The Guardian</li>
                <li>NewsAPI</li>
                <li>Google News</li>
                <li>And more...</li>
              </ul>
            </div>
            
            <div className="preferences-card">
              <h3>AI Features</h3>
              <p>Our AI analyzes news articles to provide summaries, sentiment analysis, and entity recognition.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreferencesPage;