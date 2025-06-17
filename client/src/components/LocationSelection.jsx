import React from 'react';

function LocationSelection({ categories, locations, categoryLocationPairs, setCategoryLocation }) {
  // Handle location change for a category
  const handleLocationChange = (categoryId, locationId) => {
    setCategoryLocation(categoryId, locationId === '' ? null : locationId);
  };

  return (
    <div className="location-selection">
      {categories.length === 0 ? (
        <p className="no-categories">Please select categories first to pair them with locations.</p>
      ) : (
        categories.map(category => (
          <div key={category.id} className="location-pair">
            <h3>{category.name} News Location</h3>
            <select 
              className="location-select"
              value={categoryLocationPairs[category.id] || ''}
              onChange={(e) => handleLocationChange(category.id, e.target.value)}
            >
              <option value="">Global (No specific location)</option>
              {locations.map(location => (
                <option key={location.id} value={location.code}>
                  {location.name}
                </option>
              ))}
            </select>
            <p className="location-hint">
              {categoryLocationPairs[category.id] 
                ? `You'll see ${category.name.toLowerCase()} news from ${
                    locations.find(loc => loc.code === categoryLocationPairs[category.id])?.name || 'this location'
                  }.` 
                : `You'll see global ${category.name.toLowerCase()} news.`}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default LocationSelection;