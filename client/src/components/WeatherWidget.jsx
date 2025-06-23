import React, { useState, useRef, useEffect } from 'react';
import { useWeather } from '../hooks/useWeather';
import '../styles/WeatherWidget.css';

const WeatherWidget = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const widgetRef = useRef(null);

  const {
    userLocation,
    weatherData,
    loading,
    error,
    retryCount,
    setLocation,
    retryWeatherFetch,
    hasLocation,
    hasWeatherData,
    isDataStale,
  } = useWeather();

  // Show location input if no location is available
  useEffect(() => {
    if (!hasLocation && !loading) {
      setShowLocationInput(true);
    }
  }, [hasLocation, loading]);

  // Handle clicks outside the widget to close details
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [widgetRef]);

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (manualLocation.trim()) {
      setLocation(manualLocation.trim());
      setShowLocationInput(false);
      setManualLocation('');
    }
  };

  const handleLocationCancel = () => {
    setShowLocationInput(false);
    setManualLocation('');
  };

  const handleRetry = () => {
    retryWeatherFetch();
  };

  // Show location input if needed
  if (showLocationInput) {
    return (
      <div className="weather-widget location-input">
        <div className="location-input-container">
          <h4>Enter Location</h4>
          <p>Please enter your city or location to get weather information</p>
          <form onSubmit={handleLocationSubmit}>
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="e.g., New York, NY"
              autoFocus
            />
            <div className="location-input-buttons">
              <button type="submit" disabled={!manualLocation.trim()}>
                Get Weather
              </button>
              <button type="button" onClick={handleLocationCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show loading
  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="spinner"></div>
        <span>Loading weather...</span>
      </div>
    );
  }

  // Show error with retry option
  if (error && !hasWeatherData) {
    return (
      <div className="weather-widget error">
        <div className="error-container">
          <span>Weather unavailable</span>
          {retryCount < 3 && (
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Don't render if no weather data
  if (!hasWeatherData) {
    return null;
  }

  const weather = weatherData;

  return (
    <div 
      ref={widgetRef}
      className={`weather-widget ${showDetails ? 'expanded' : ''} ${isDataStale ? 'stale' : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="weather-info">
        <span className="weather-temp">{weather.temperature}°</span>
        <span className="weather-desc">{weather.description}</span>
        {isDataStale && <span className="stale-indicator">•</span>}
      </div>

      {showDetails && (
        <div className="weather-details">
          <h4>{weather.location}</h4>
          <div className="weather-details-grid">
            <div className="detail-item">
              <span className="detail-label">Feels Like</span>
              <span className="detail-value">{weather.feelsLike}°</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Humidity</span>
              <span className="detail-value">{weather.humidity}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Wind</span>
              <span className="detail-value">{weather.windSpeed} mph</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">UV Index</span>
              <span className="detail-value">{weather.uvIndex}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Visibility</span>
              <span className="detail-value">{weather.visibility} mi</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pressure</span>
              <span className="detail-value">{weather.pressure} in</span>
            </div>
          </div>
          {isDataStale && (
            <div className="stale-warning">
              <p>Data may be outdated. Click to refresh.</p>
              <button onClick={handleRetry} className="refresh-button">
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
