import WeatherstackApiService from './weatherstackApiService.js';
import log from '../utils/logger.js';

const logger = log('WeatherService');

class WeatherService {
  constructor() {
    this.weatherProvider = new WeatherstackApiService();
  }

  /**
   * Get weather data for a given location.
   * @param {string} location - The location to get weather for.
   * @returns {Promise<object>} The weather data.
   */
  async getWeatherForLocation(location) {
    if (!location) {
      logger('getWeatherForLocation called with no location.');
      return null;
    }
    
    logger(`Fetching weather for location: ${location}`);
    try {
      const weatherData = await this.weatherProvider.getWeather(location);
      return weatherData;
    } catch (error) {
      logger.error(`Error fetching weather for ${location}:`, error);
      throw new Error('Failed to retrieve weather data.');
    }
  }
}

export default new WeatherService(); 