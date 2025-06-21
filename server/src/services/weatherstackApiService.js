import BaseNewsService from './baseNewsService.js';

/**
 * Service class for interacting with the Weatherstack API.
 * This service adapts weather data into the application's article format.
 */
class WeatherstackApiService extends BaseNewsService {
  constructor(config) {
    super(config);
    this.endpoint = 'current';
  }

  /**
   * Normalizes weather data into a standard article format.
   * @param {object} weatherData - The weather data object from the Weatherstack API.
   * @returns {object} A normalized article-like object.
   */
  normalizeArticle(weatherData) {
    const { location, current } = weatherData;
    if (!location || !current) {
      return null;
    }

    return {
      id: `weather_${location.lat}_${location.lon}`,
      title: `Weather in ${location.name}, ${location.country}`,
      description: `Currently ${current.weather_descriptions.join(', ')} at ${current.temperature}°C.`,
      content: `The current weather in ${location.name} is ${current.temperature}°C, but it feels like ${current.feelslike}°C. ` +
               `The wind is blowing at ${current.wind_speed} km/h from the ${current.wind_dir}. ` +
               `Humidity is at ${current.humidity}%.`,
      url: `https://weatherstack.com/ws_go.php?query=${location.name}`,
      imageUrl: current.weather_icons[0] || null,
      source: 'Weatherstack',
      publishedAt: new Date(location.localtime_epoch * 1000).toISOString(),
      category: 'weather',
    };
  }

  /**
   * Fetches weather data for a location. The category is ignored.
   * @param {string} category - Ignored for this service.
   * @param {string} location - The location to fetch weather for.
   * @param {number} limit - Ignored. Only one "article" is returned.
   * @returns {Promise<Array<object>>} A promise resolving to an array with a single weather "article".
   */
  async getArticlesByCategory(category, location = 'New York', limit = 1) {
    if (!location) return [];

    const params = {
      access_key: this.apiKey,
      query: location,
    };
    
    const data = await this.fetch(this.endpoint, params);
    const normalized = this.normalizeArticle(data);
    return normalized ? [normalized] : [];
  }

  /**
   * Searches for weather by location using the keyword.
   * @param {string} keyword - The location to search for.
   * @param {string} category - Ignored.
   * @param {string} location - If provided, overrides keyword.
   * @param {number} limit - Ignored.
   * @returns {Promise<Array<object>>} A promise resolving to an array with a single weather "article".
   */
  async searchArticles(keyword, category = null, location = null, limit = 1) {
    const query = location || keyword;
    if (!query) return [];

    return this.getArticlesByCategory(null, query, limit);
  }

  /**
   * Fetches top headlines, which for weather means the weather for a default or specified location.
   * @param {string} category - Ignored.
   * @param {string} location - The location.
   * @param {number} limit - Ignored.
   * @returns {Promise<Array<object>>} A promise resolving to an array with a single weather "article".
   */
  async getTopHeadlines(category = null, location = 'New York', limit = 1) {
    return this.getArticlesByCategory(category, location, limit);
  }
}

export default WeatherstackApiService; 