/**
 * Utility for accessing the current API mode (mock/live).
 * @module loaderUtils
 */
import { API_MODE } from '../config/appConfig';

/**
 * Returns the current API mode for data loaders.
 * @returns {string} The API mode (e.g., 'mock' or 'live')
 */
export function getApiMode(): string {
  return API_MODE;
}

export { API_MODE };
