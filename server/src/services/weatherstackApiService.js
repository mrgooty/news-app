import BaseNewsService from './baseNewsService.js';
import log from '../utils/logger.js';

const logger = log('WeatherstackApiService');

/**
 * Service class for interacting with the Weatherstack API.
 */
class WeatherstackApiService extends BaseNewsService {
  constructor() {
    super('weatherstack');
    this.endpoint = 'current';
  }

  /**
   * Get current weather data for a location.
   * This is the primary method to interact with the Weatherstack API.
   * @param {string} location - City name, coordinates, or IP address ('check').
   * @returns {Promise<Object>} The raw weather data from the API.
   */
  async getWeather(location) {
    if (!location) {
      logger.error('getWeather requires a location.');
      throw new Error('Location is required for fetching weather data.');
    }

    const params = {
      query: location,
      units: 'f' // Request Fahrenheit
    };
    
    try {
      logger(`Fetching weather for location: ${location}`);
      const data = await this.httpClient.get(this.endpoint, params);
      
      // Basic validation of the response
      if (data && data.current && data.location) {
        return this.normalizeWeatherData(data);
      } else {
        logger.error('Received invalid weather data structure from Weatherstack', data);
        throw new Error('Invalid data structure from weather API.');
      }
    } catch (error) {
      logger.error(`[${this.serviceName}] Error fetching weather data for "${location}":`, error.message);
      logger.error(`Full error details:`, error);
      // Re-throw a more generic error to not expose implementation details.
      throw new Error('Failed to retrieve weather data.');
    }
  }

  /**
   * Get current weather data for a location (alias for getWeather).
   * This method is used by GraphQL resolvers.
   * @param {string} location - City name, coordinates, or IP address ('check').
   * @returns {Promise<Object>} The raw weather data from the API.
   */
  async getCurrentWeather(location) {
    return this.getFullWeatherData(location);
  }

  /**
   * Get weather data by coordinates.
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} The raw weather data from the API.
   */
  async getWeatherByCoordinates(lat, lon) {
    if (!lat || !lon) {
      logger.error('getWeatherByCoordinates requires both lat and lon.');
      throw new Error('Latitude and longitude are required for fetching weather data.');
    }

    const location = `${lat},${lon}`;
    return this.getFullWeatherData(location);
  }

  /**
   * Get weather data by US zip code.
   * @param {string} zipCode - US zip code
   * @returns {Promise<Object>} The raw weather data from the API.
   */
  async getWeatherByZipCode(zipCode) {
    if (!zipCode) {
      logger.error('getWeatherByZipCode requires a zip code.');
      throw new Error('Zip code is required for fetching weather data.');
    }

    return this.getFullWeatherData(zipCode);
  }

  /**
   * Get the full weather data structure as expected by GraphQL resolvers.
   * @param {string} location - City name, coordinates, or IP address ('check').
   * @returns {Promise<Object>} The full weather data structure.
   */
  async getFullWeatherData(location) {
    if (!location) {
      logger.error('getFullWeatherData requires a location.');
      throw new Error('Location is required for fetching weather data.');
    }

    const params = {
      query: location,
      units: 'f' // Request Fahrenheit
    };
    
    try {
      logger(`Fetching full weather data for location: ${location}`);
      logger(`API Config:`, this.apiConfig);
      logger(`Params:`, params);
      const data = await this.httpClient.get(this.endpoint, params);
      
      // Basic validation of the response
      if (data && data.current && data.location) {
        return data; // Return the full data structure
      } else {
        logger.error('Received invalid weather data structure from Weatherstack', data);
        throw new Error('Invalid data structure from weather API.');
      }
    } catch (error) {
      logger.error(`[${this.serviceName}] Error fetching weather data for "${location}":`, error.message);
      logger.error(`Full error details:`, error);
      // Re-throw a more generic error to not expose implementation details.
      throw new Error('Failed to retrieve weather data.');
    }
  }
  
  /**
   * Normalizes the raw weather data from Weatherstack API into a clean, consistent format.
   * @param {object} data - The raw data object from the Weatherstack API.
   * @returns {object} A normalized weather data object.
   */
  normalizeWeatherData(data) {
    const { location, current } = data;
    return {
      location: location.name,
      country: location.country,
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      localtime: location.localtime,
      temperature: current.temperature,
      feelsLike: current.feelslike,
      description: current.weather_descriptions[0],
      icon: current.weather_code,
      humidity: current.humidity,
      windSpeed: current.wind_speed,
      windDirection: current.wind_dir,
      pressure: current.pressure,
      visibility: current.visibility,
      uvIndex: current.uv_index,
      lastUpdated: current.observation_time,
    };
  }
}

export default WeatherstackApiService;
