import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, gql } from '@apollo/client';
import {
  setUserLocation,
  clearUserLocation,
  saveWeatherPreferences,
  loadWeatherPreferences,
  resetRetryCount,
} from '../store/slices/weatherSlice';

const GET_WEATHER_BY_LOCATION = gql`
  query GetWeather($location: String) {
    getWeather(location: $location) {
      location
      temperature
      feelsLike
      description
      icon
      humidity
      windSpeed
      windDirection
      pressure
      visibility
      uvIndex
      lastUpdated
    }
  }
`;

const GET_USER_LOCATION = gql`
  query GetUserLocation {
    getUserLocation {
      formatted
    }
  }
`;

export const useWeather = () => {
  const dispatch = useDispatch();
  const {
    userLocation,
    weatherData,
    lastWeatherData,
    lastUpdated,
    loading: reduxLoading,
    error: reduxError,
    retryCount,
    isLoaded,
  } = useSelector((state) => state.weather);

  // Race condition protection
  const currentSession = useRef({});
  const lastRequestSession = useRef(null);

  // Load saved preferences on mount
  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadWeatherPreferences());
    }
  }, [dispatch, isLoaded]);

  // Get user location from API
  const { data: locationData, loading: locationLoading, error: locationError } = useQuery(GET_USER_LOCATION, {
    errorPolicy: 'ignore',
    skip: !!userLocation, // Skip if we already have a saved location
  });

  // Update location when API returns data
  useEffect(() => {
    if (locationData?.getUserLocation?.formatted && !userLocation) {
      dispatch(setUserLocation(locationData.getUserLocation.formatted));
    }
  }, [locationData, userLocation, dispatch]);

  // Get weather data with race condition protection
  const { data: weatherQueryData, loading: weatherLoading, error: weatherError, refetch } = useQuery(
    GET_WEATHER_BY_LOCATION,
    {
      variables: { location: userLocation },
      skip: !userLocation,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      context: {
        // Add session tracking to prevent race conditions
        session: currentSession.current,
      },
    }
  );

  // Update weather data when query returns (with race condition check)
  useEffect(() => {
    if (weatherQueryData?.getWeather) {
      // Check if this is still the current session
      if (lastRequestSession.current === currentSession.current) {
        dispatch(saveWeatherPreferences({
          userLocation,
          weatherData: weatherQueryData.getWeather,
        }));
      }
    }
  }, [weatherQueryData, userLocation, dispatch]);

  // Set manual location with new session
  const setLocation = useCallback((location) => {
    // Create new session for this request
    currentSession.current = {};
    lastRequestSession.current = currentSession.current;
    dispatch(setUserLocation(location));
  }, [dispatch]);

  // Clear location
  const clearLocation = useCallback(() => {
    dispatch(clearUserLocation());
  }, [dispatch]);

  // Retry weather fetch with new session
  const retryWeatherFetch = useCallback(() => {
    if (userLocation) {
      // Create new session for retry
      currentSession.current = {};
      lastRequestSession.current = currentSession.current;
      dispatch(resetRetryCount());
      refetch();
    }
  }, [userLocation, dispatch, refetch]);

  // Check if data is stale (older than 30 minutes)
  const isDataStale = useCallback(() => {
    if (!lastUpdated) return true;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return new Date(lastUpdated) < thirtyMinutesAgo;
  }, [lastUpdated]);

  // Auto-refresh stale data with session tracking
  useEffect(() => {
    if (userLocation && isDataStale() && !weatherLoading) {
      // Create new session for auto-refresh
      currentSession.current = {};
      lastRequestSession.current = currentSession.current;
      refetch();
    }
  }, [userLocation, isDataStale, weatherLoading, refetch]);

  return {
    // State
    userLocation,
    weatherData: weatherQueryData?.getWeather || weatherData,
    lastWeatherData,
    lastUpdated,
    
    // Loading states
    loading: locationLoading || weatherLoading || reduxLoading,
    locationLoading,
    weatherLoading,
    
    // Error states
    error: weatherError?.message || reduxError,
    locationError: locationError?.message,
    
    // Retry info
    retryCount,
    
    // Actions
    setLocation,
    clearLocation,
    retryWeatherFetch,
    
    // Utilities
    isDataStale: isDataStale(),
    hasLocation: !!userLocation,
    hasWeatherData: !!(weatherQueryData?.getWeather || weatherData),
  };
}; 