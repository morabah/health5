/**
 * Utility for accessing the current API mode (mock/live).
 * @module loaderUtils
 */
import { API_MODE } from '../config/appConfig';
import { getApiMode as getApiModeConfig } from '@/config/apiMode';

/**
 * Returns the current API mode for data loaders.
 * @returns {'mock' | 'live'} The API mode (e.g., 'mock' or 'live')
 */
// Unified API mode getter for all loaders
export function getApiMode(): 'mock' | 'live' {
  const mode = getApiModeConfig();
  return mode === 'mock' || mode === 'live' ? mode : 'mock';
}

export { API_MODE };
