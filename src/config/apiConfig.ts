/**
 * Unified API configuration utility
 * 
 * This file centralizes all API-related configuration in one place:
 * - API Mode (mock/live) with localStorage persistence
 * - Debug logging for API operations
 * - Centralized initialization function for Firestore
 */
import { logInfo, logWarn, logError } from '@/lib/logger';

// Type definitions
export type ApiMode = 'mock' | 'live';

// Constants
const API_MODE_STORAGE_KEY = 'apiMode';
const DEFAULT_MODE: ApiMode = (process.env.NEXT_PUBLIC_API_MODE as ApiMode) || 'mock';

/**
 * Gets the current API mode with proper fallbacks
 * - Checks localStorage first (client-side)
 * - Falls back to environment variable
 * - Defaults to 'mock' if all else fails
 */
export function getApiMode(): ApiMode {
  // If environment forces live, always use live, bypassing localStorage
  if (DEFAULT_MODE === 'live') {
    logInfo('API mode forced to live by environment', { mode: DEFAULT_MODE });
    return 'live';
  }
  // Server-side always uses environment variable
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }
  
  try {
    // Client-side checks localStorage first
    const stored = localStorage.getItem(API_MODE_STORAGE_KEY);
    
    // Validate it's a valid API mode
    if (stored === 'live' || stored === 'mock') {
      logInfo('API mode from localStorage', { mode: stored });
      return stored;
    }
    
    // If invalid value or not found, use environment default
    if (stored && stored !== 'live' && stored !== 'mock') {
      logWarn('Invalid API mode found in localStorage, using default', { 
        found: stored, 
        defaultMode: DEFAULT_MODE 
      });
    }
    
    // Set localStorage to the default for future use
    localStorage.setItem(API_MODE_STORAGE_KEY, DEFAULT_MODE);
    return DEFAULT_MODE;
  } catch (error) {
    logError('Error getting API mode', { error });
    return DEFAULT_MODE;
  }
}

/**
 * Sets the API mode and notifies all parts of the application
 */
export function setApiMode(mode: ApiMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Validate the mode
    if (mode !== 'live' && mode !== 'mock') {
      throw new Error(`Invalid API mode: ${mode}`);
    }
    
    // Store in localStorage
    localStorage.setItem(API_MODE_STORAGE_KEY, mode);
    
    // Dispatch event for same-tab listeners
    window.dispatchEvent(new CustomEvent('apiModeChanged', { detail: { mode } }));
    
    // Use BroadcastChannel for cross-tab communication
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('api_mode_channel');
      bc.postMessage({ type: 'apiModeChange', mode });
      setTimeout(() => bc.close(), 100);
    }
    
    logInfo('API mode changed', { mode });
  } catch (error) {
    logError('Error setting API mode', { error, mode });
  }
}

/**
 * Registers a callback for API mode changes
 * Works with both same-tab and cross-tab changes
 */
export function onApiModeChange(callback: (mode: ApiMode) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  // Function to handle the event
  const handleModeChange = (event: Event) => {
    const mode = getApiMode();
    callback(mode);
  };
  
  // Custom event handler (same tab)
  window.addEventListener('apiModeChanged', handleModeChange);
  
  // Storage event handler (cross-tab)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === API_MODE_STORAGE_KEY) {
      const newMode = event.newValue as ApiMode;
      if (newMode === 'live' || newMode === 'mock') {
        callback(newMode);
      }
    }
  };
  window.addEventListener('storage', handleStorage);
  
  // BroadcastChannel handler (cross-tab, modern browsers)
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel('api_mode_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'apiModeChange' && 
          (event.data.mode === 'live' || event.data.mode === 'mock')) {
        callback(event.data.mode);
      }
    };
  } catch (error) {
    // BroadcastChannel not supported
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('apiModeChanged', handleModeChange);
    window.removeEventListener('storage', handleStorage);
    if (bc) bc.close();
  };
} 