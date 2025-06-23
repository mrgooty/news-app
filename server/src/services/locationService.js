import axios from "axios";
import config from "../config/config.js";

/**
 * Service for handling location detection and geolocation
 */
class LocationService {
  constructor() {
    this.ipApiUrl = "http://ip-api.com/json";
    this.ipInfoUrl = "https://ipinfo.io/json";
  }

  /**
   * Get location information from IP address
   * @param {string} ip - IP address (optional, will use client IP if not provided)
   * @returns {Promise<Object>} Location data
   */
  async getLocationByIP(ip = null) {
    try {
      const url = ip ? `${this.ipApiUrl}/${ip}` : this.ipApiUrl;
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data && response.data.status === "success") {
        return {
          country: response.data.country,
          countryCode: response.data.countryCode,
          region: response.data.regionName,
          regionCode: response.data.region,
          city: response.data.city,
          zip: response.data.zip,
          lat: response.data.lat,
          lon: response.data.lon,
          timezone: response.data.timezone,
          isp: response.data.isp,
          ip: response.data.query
        };
      }
      
      throw new Error("Failed to get location from IP");
    } catch (error) {
      console.error("[LocationService] Error getting location by IP:", error.message);
      throw error;
    }
  }

  /**
   * Get location information using ipinfo.io as fallback
   * @returns {Promise<Object>} Location data
   */
  async getLocationByIPInfo() {
    try {
      const response = await axios.get(this.ipInfoUrl, { timeout: 5000 });
      
      if (response.data) {
        const [lat, lon] = response.data.loc ? response.data.loc.split(",") : [null, null];
        return {
          country: response.data.country,
          countryCode: response.data.country,
          region: response.data.region,
          regionCode: response.data.region,
          city: response.data.city,
          zip: response.data.postal,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          timezone: response.data.timezone,
          isp: response.data.org,
          ip: response.data.ip
        };
      }
      
      throw new Error("Failed to get location from ipinfo");
    } catch (error) {
      console.error("[LocationService] Error getting location by ipinfo:", error.message);
      throw error;
    }
  }

  /**
   * Get location information with fallback
   * @param {string} ip - IP address (optional)
   * @returns {Promise<Object>} Location data
   */
  async getLocation(ip = null) {
    try {
      return await this.getLocationByIP(ip);
    } catch (error) {
      console.log("[LocationService] Primary location service failed, trying fallback...");
      try {
        return await this.getLocationByIPInfo();
      } catch (fallbackError) {
        console.error("[LocationService] All location services failed");
        throw new Error("Unable to determine location");
      }
    }
  }

  /**
   * Validate US zip code format
   * @param {string} zipCode - Zip code to validate
   * @returns {boolean} True if valid US zip code
   */
  isValidUSZipCode(zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  /**
   * Format location for display
   * @param {Object} location - Location data
   * @returns {string} Formatted location string
   */
  formatLocation(location) {
    if (!location) return "Unknown location";
    
    if (location.country === "United States") {
      return `${location.city}, ${location.regionCode}`;
    }
    
    return `${location.city}, ${location.country}`;
  }

  /**
   * Get location query string for news APIs
   * @param {Object} location - Location data
   * @returns {string} Location query string
   */
  getLocationQuery(location) {
    if (!location) return null;
    
    if (location.country === "United States" && location.zip) {
      return location.zip;
    }
    
    return `${location.city}, ${location.country}`;
  }
}

export default new LocationService();
