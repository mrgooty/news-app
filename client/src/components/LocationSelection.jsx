import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_LOCATIONS } from '../graphql/queries';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { CATEGORY_COLOR_CLASSES } from '../constants';

function LocationSelection() {
  const { loading, error, data } = useQuery(GET_LOCATIONS);
  const { selectedCategories, categoryLocationPairs, setCategoryLocation } = useUserPreferences();
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getColorClass = (id) => CATEGORY_COLOR_CLASSES[selectedCategories.indexOf(id) % CATEGORY_COLOR_CLASSES.length];

  // Handle no selected categories
  if (selectedCategories.length === 0) {
    return (
      <div className="location-selection empty-state">
        <h2>Location Pairing</h2>
        <p>Please select categories first to pair with locations.</p>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading locations...</div>;
  if (error) return <div className="error">Error loading locations: {error.message}</div>;

  // Filter locations based on search term
  const filteredLocations = searchTerm 
    ? data.locations.filter(loc => 
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data.locations;

  return (
    <div className="location-selection">
      <h2>Pair Locations with Categories</h2>
      <p className="selection-instruction">Select a location for each category</p>
      
      <div className="category-tabs">
        {selectedCategories.map(categoryId => {
          // Find the category name from the selected ID
          const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
          const hasLocation = categoryLocationPairs[categoryId];
          
          return (
            <div
              key={categoryId}
              className={`category-tab ${getColorClass(categoryId)} ${activeCategory === categoryId ? 'active' : ''} ${hasLocation ? 'has-location' : ''}`}
              onClick={() => setActiveCategory(categoryId)}
            >
              <span className="tab-name">{categoryName}</span>
              {hasLocation && <span className="location-indicator">✓</span>}
            </div>
          );
        })}
      </div>
      
      {activeCategory && (
        <div className="location-selector">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="location-search"
            />
          </div>
          
          <div className="locations-grid">
            {filteredLocations.map(location => (
              <div 
                key={location.id}
                className={`location-item ${categoryLocationPairs[activeCategory] === location.id ? 'selected' : ''}`}
                onClick={() => setCategoryLocation(activeCategory, location.id)}
              >
                <h4>{location.name}</h4>
                <span className="location-code">{location.code}</span>
                {categoryLocationPairs[activeCategory] === location.id && (
                  <div className="selection-check">✓</div>
                )}
              </div>
            ))}
            
            {filteredLocations.length === 0 && (
              <div className="no-locations">No locations match your search.</div>
            )}
          </div>
        </div>
      )}
      
      {!activeCategory && selectedCategories.length > 0 && (
        <div className="select-prompt">
          <p>Select a category above to pair with a location</p>
        </div>
      )}
    </div>
  );
}

export default LocationSelection;