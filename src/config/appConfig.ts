/**
 * Centralized App Configuration Module
 * Use this for all global app parameters (API mode, theme, feature flags, user preferences, etc.)
 * - Type-safe getter/setter for each parameter
 * - Handles persistence (localStorage, cookies, etc.)
 * - Supports cross-tab sync where needed
 * - The ONLY source of truth for app-wide config
 */

// --- Types ---
export type ApiMode = 'live' | 'mock';
export type ThemeMode = 'light' | 'dark' | 'system';
export type DataSource = 'mock' | 'firestore' | 'crm';

export interface AppConfig {
  apiMode: ApiMode;
  theme: ThemeMode;
  featureXEnabled: boolean; // Example feature flag
}

// --- Keys & Defaults ---
const KEYS = {
  apiMode: 'apiMode',
  theme: 'themeMode',
  featureXEnabled: 'featureXEnabled',
};

const DEFAULTS: AppConfig = {
  apiMode: (process.env.NEXT_PUBLIC_API_MODE as ApiMode) || 'mock',
  theme: 'system',
  featureXEnabled: false,
};

// Export API_MODE for legacy compatibility (deprecated, use getApiMode instead)
export const API_MODE = DEFAULTS.apiMode;

export const DATA_SOURCE: DataSource = 'mock'; // Change to 'crm' or 'firestore' as needed

export const CRM_API_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_CRM_API_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_CRM_API_KEY,
};

// --- API MODE ---
export function getApiMode(): ApiMode {
  // Always prefer the env variable in production (NODE_ENV === 'production')
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return DEFAULTS.apiMode;
  }
  // In development, allow localStorage override for testing, else sync with env
  const stored = localStorage.getItem(KEYS.apiMode);
  if (stored === 'live' || stored === 'mock') return stored;
  if (stored !== null) {
    // Invalid value found, clean up and log
    console.warn(`[appConfig] Invalid apiMode in localStorage: '${stored}', resetting to default.`);
    localStorage.removeItem(KEYS.apiMode);
  }
  localStorage.setItem(KEYS.apiMode, DEFAULTS.apiMode);
  return DEFAULTS.apiMode;
}

export function setApiMode(mode: ApiMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.apiMode, mode);
    window.dispatchEvent(new Event('apiModeChanged'));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('apiMode');
      channel.postMessage({ mode });
      channel.close();
    }
  }
}

// --- THEME MODE ---
export function getThemeMode(): ThemeMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(KEYS.theme);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    localStorage.setItem(KEYS.theme, DEFAULTS.theme);
    return DEFAULTS.theme;
  }
  return DEFAULTS.theme;
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.theme, mode);
    window.dispatchEvent(new Event('themeModeChanged'));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('themeMode');
      channel.postMessage({ mode });
      channel.close();
    }
  }
}

// --- FEATURE X ENABLED ---
export function getFeatureXEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(KEYS.featureXEnabled);
    if (stored === 'true' || stored === 'false') return stored === 'true';
    localStorage.setItem(KEYS.featureXEnabled, DEFAULTS.featureXEnabled.toString());
    return DEFAULTS.featureXEnabled;
  }
  return DEFAULTS.featureXEnabled;
}

export function setFeatureXEnabled(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.featureXEnabled, enabled.toString());
    window.dispatchEvent(new Event('featureXEnabledChanged'));
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('featureXEnabled');
      channel.postMessage({ enabled });
      channel.close();
    }
  }
}

// --- Dynamic Data Source Getter ---
export function getDoctorDataSource(): DataSource {
  const mode = getApiMode();
  if (mode === 'mock') return 'mock';
  // You can add logic here for Firestore if needed
  return 'crm';
}

// --- EXTENSIBILITY ---
// Add new parameters here following the same pattern (getter/setter, type-safe, sync-aware)

// --- Utility: Subscribe to changes ---
export function subscribeConfigChange(
  key: keyof AppConfig,
  callback: (value: any) => void
) {
  if (typeof window === 'undefined') return;
  const eventName = key + 'Changed';
  window.addEventListener(eventName, () => {
    if (key === 'apiMode') callback(getApiMode());
    if (key === 'theme') callback(getThemeMode());
    if (key === 'featureXEnabled') callback(getFeatureXEnabled());
    // Extend as you add more keys
  });
  window.addEventListener('storage', (e) => {
    if (e.key === KEYS[key]) {
      if (key === 'apiMode') callback(getApiMode());
      if (key === 'theme') callback(getThemeMode());
      if (key === 'featureXEnabled') callback(getFeatureXEnabled());
    }
  });
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(key);
    channel.onmessage = (e) => {
      if (e.data && (e.data.mode !== undefined || e.data.enabled !== undefined)) {
        if (key === 'featureXEnabled' && typeof e.data.enabled === 'boolean') callback(e.data.enabled);
        else if (key === 'apiMode' && e.data.mode) callback(e.data.mode);
        else if (key === 'theme' && e.data.mode) callback(e.data.mode);
      }
    };
  }
}
