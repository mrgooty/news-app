import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { useSelector, useDispatch } from "react-redux";
import { setUserLocation } from "../store/slices/weatherSlice";
import NewsGrid from "./NewsGrid";
import "../styles/LocalNews.css";

const GET_LOCAL_NEWS = gql`
  query GetLocalNews($location: String, $first: Int) {
    getLocalNews(location: $location, first: $first) {
      edges {
        node {
          id
          title
          description
          content
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
      }
    }
  }
`;

const GET_USER_LOCATION = gql`
  query GetUserLocation {
    getUserLocation {
      country
      countryCode
      region
      regionCode
      city
      zip
      lat
      lon
      timezone
      formatted
    }
  }
`;

const LocalNews = () => {
  const dispatch = useDispatch();
  const { userLocation } = useSelector((state) => state.weather);
  const { location: countryLocation } = useSelector((state) => state.userPreferences);
  
  const [locationInput, setLocationInput] = useState("");
  const [showLocationForm, setShowLocationForm] = useState(false);

  // Get user location from API if we don't have it in Redux
  const { data: locationData, loading: locationLoading } = useQuery(GET_USER_LOCATION, {
    skip: !!userLocation, // Skip if we already have a location in Redux
  });

  // Set location when API returns data and we don't have it in Redux
  useEffect(() => {
    if (locationData?.getUserLocation && !userLocation) {
      const loc = locationData.getUserLocation;
      dispatch(setUserLocation(loc.formatted));
      setLocationInput(loc.formatted);
    }
  }, [locationData, userLocation, dispatch]);

  // Determine the location to use for news
  const effectiveLocation = userLocation || countryLocation;

  // Get local news
  const { data: newsData, loading: newsLoading, error: newsError, refetch } = useQuery(GET_LOCAL_NEWS, {
    variables: { location: effectiveLocation, first: 20 },
    skip: !effectiveLocation,
  });

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      dispatch(setUserLocation(locationInput.trim()));
      setShowLocationForm(false);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Show loading only if we're fetching location and don't have any location
  if (locationLoading && !effectiveLocation) {
    return (
      <div className="local-news-container">
        <div className="loading">Loading location...</div>
      </div>
    );
  }

  // Only show location prompt if we have no location at all
  if (!effectiveLocation) {
    return (
      <div className="local-news-container">
        <div className="location-prompt">
          <h2>Local News</h2>
          <p>We need your location to show you local news.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowLocationForm(true)}
          >
            Enter Location
          </button>
        </div>
        
        {showLocationForm && (
          <div className="location-form">
            <form onSubmit={handleLocationSubmit}>
              <input
                type="text"
                placeholder="Enter city, state or zip code"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="location-input"
              />
              <button type="submit" className="btn btn-primary">
                Get Local News
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const articles = newsData?.getLocalNews?.edges?.map(edge => edge.node) || [];
  const errors = newsData?.getLocalNews?.errors || [];

  return (
    <div className="local-news-container">
      <div className="local-news-header">
        <h2>Local News - {effectiveLocation}</h2>
        <div className="local-news-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowLocationForm(true)}
          >
            Change Location
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={newsLoading}
          >
            {newsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {showLocationForm && (
        <div className="location-form">
          <form onSubmit={handleLocationSubmit}>
            <input
              type="text"
              placeholder="Enter city, state or zip code"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="location-input"
            />
            <button type="submit" className="btn btn-primary">
              Update Location
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowLocationForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              Error from {error.source}: {error.message}
            </div>
          ))}
        </div>
      )}

      {newsLoading ? (
        <div className="loading">Loading local news...</div>
      ) : newsError ? (
        <div className="error">
          <p>Failed to load local news: {newsError.message}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="no-news">
          <p>No local news found for {effectiveLocation}.</p>
          <p>Try changing the location or check back later.</p>
        </div>
      ) : (
        <NewsGrid articles={articles} />
      )}
    </div>
  );
};

export default LocalNews;
