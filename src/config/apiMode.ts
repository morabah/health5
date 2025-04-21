/**
 * Centralized API Mode configuration and sync utility
 * Ensures all pages/components read and write API mode consistently.
 * Uses localStorage for persistence and supports cross-tab sync.
 */

// Allowed API modes
export type ApiMode = 'live' | 'mock';

const API_MODE_KEY = 'apiMode';
const DEFAULT_MODE: ApiMode = (process.env.NEXT_PUBLIC_API_MODE as ApiMode) || 'live';

// Get current API mode (localStorage > env > fallback)
export function getApiMode(): ApiMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(API_MODE_KEY);
    if (stored === 'live' || stored === 'mock') {
      return stored;
    }
    // Set default if missing
    localStorage.setItem(API_MODE_KEY, DEFAULT_MODE);
    return DEFAULT_MODE;
  }
  return DEFAULT_MODE;
}

// Set API mode and broadcast change
export function setApiMode(mode: ApiMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_MODE_KEY, mode);
    window.dispatchEvent(new Event('apiModeChanged'));
    // For modern browsers, also use BroadcastChannel if available
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('apiMode');
      channel.postMessage({ mode });
      channel.close();
    }
  }
}

// Subscribe to API mode changes (localStorage or BroadcastChannel)
export function subscribeApiModeChange(callback: (mode: ApiMode) => void) {
  if (typeof window === 'undefined') return;

  const handler = () => {
    const mode = getApiMode();
    callback(mode);
  };

  window.addEventListener('apiModeChanged', handler);
  window.addEventListener('storage', (e) => {
    if (e.key === API_MODE_KEY) handler();
  });
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('apiMode');
    channel.onmessage = (e) => {
      if (e.data && (e.data.mode === 'live' || e.data.mode === 'mock')) {
        callback(e.data.mode);
      }
    };
  }
}

// Utility to clear API mode (for testing)
export function clearApiMode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_MODE_KEY);
  }
}
