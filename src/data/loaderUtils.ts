/**
 * Utility for accessing the current API mode (mock/live).
 * @module loaderUtils
 */
import { getApiMode as getApiModeConfig } from '@/config/apiConfig';

/**
 * Returns the current API mode for data loaders.
 * @returns {'mock' | 'live'} The API mode (e.g., 'mock' or 'live')
 */
// Unified API mode getter for all loaders
export function getApiMode(): 'mock' | 'live' {
  try {
    const mode = getApiModeConfig();
    console.log('[loaderUtils] Getting API mode:', mode);
    return mode === 'mock' || mode === 'live' ? mode : 'mock';
  } catch (error) {
    console.error('[loaderUtils] Error getting API mode:', error);
    return 'mock'; // Default to mock on any error
  }
}
