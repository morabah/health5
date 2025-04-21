/**
 * Global event bus for app-wide event handling and logging.
 * Allows components and modules to subscribe to and emit events such as logging and validation,
 * supporting debugging, observability, and CMS integration.
 */
import mitt, { Emitter, Handler, EventType } from 'mitt';
import { getApiMode, setApiMode } from '@/config/appConfig';

// Flag to enable/disable verbose debugging
const DEBUG_EVENT_BUS = false;

/**
 * Payload for log events.
 */
export interface LogPayload {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  data?: any;
  timestamp: string;
}

/**
 * Payload for validation events.
 */
export interface ValidationPayload {
  promptId: string;
  status: 'success' | 'failure';
  details?: string;
  timestamp: string;
}

/**
 * Payload for API mode change events.
 */
export interface ApiModePayload {
  oldMode: string;
  newMode: string;
  source: string;
  timestamp: string;
}

/**
 * Application event map for the event bus.
 */
export type AppEvents = {
  'log_event': LogPayload;
  'validation_event': ValidationPayload;
  'api_mode_change': ApiModePayload;
};

/**
 * Global event emitter instance for app events.
 */
export const appEventBus = mitt<AppEvents>();

// Add debugging to the event bus
if (DEBUG_EVENT_BUS) {
  // Track event listeners
  const originalOn = appEventBus.on;
  appEventBus.on = <Key extends keyof AppEvents>(type: Key, handler: Handler<AppEvents[Key]>) => {
    console.log(`[EVENT_BUS] Adding listener for '${type}'`);
    return originalOn(type, handler);
  };

  // Track event emissions
  const originalEmit = appEventBus.emit;
  appEventBus.emit = <Key extends keyof AppEvents>(type: Key, event: AppEvents[Key]) => {
    // Only log non-session events to reduce noise
    if (type !== 'log_event' || (type === 'log_event' && !(event as LogPayload).message.includes('Session timeout reset'))) {
      console.log(`[EVENT_BUS] Emitting '${type}'`, event);
    }
    return originalEmit(type, event);
  };
}

/**
 * Helper function to set an event in localStorage for cross-tab communication
 */
export function setEventInLocalStorage(payload: LogPayload): void {
  try {
    // Don't log session timeout events to reduce noise
    if (payload.message.includes('Session timeout reset')) {
      return;
    }
    
    const storageKey = `cms_log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(storageKey, JSON.stringify(payload));
    
    // Set a master key to trigger storage events
    localStorage.setItem('cms_log_master', storageKey);
    
    if (DEBUG_EVENT_BUS) {
      console.log(`[EVENT_BUS] Set localStorage event key: ${storageKey}`);
    }
  } catch (e) {
    console.error('[EVENT_BUS] Error setting localStorage:', e);
  }
}

/**
 * Helper function to specifically handle API mode changes.
 * This ensures changes are properly synchronized across tabs and components.
 * @param {string} newMode - The new API mode to set ('live' or 'mock')
 * @param {string} source - Source identifier for the change
 * @param {boolean} [preventAutoSync=false] - If true, adds a flag to prevent other tabs from auto-syncing
 */
export function syncApiModeChange(newMode: string, source: string, preventAutoSync: boolean = false): void {
  if (typeof window === 'undefined') return;

  try {
    // Get current value
    const oldMode = getApiMode() || 'mock';
    
    // Only update if the mode is actually changing
    if (newMode === oldMode && source !== 'force_refresh') {
      if (DEBUG_EVENT_BUS) console.log(`[EVENT_BUS] API mode already set to ${newMode}, not updating`);
      return;
    }
    
    if (DEBUG_EVENT_BUS) console.log(`[EVENT_BUS] Syncing API mode: ${oldMode} -> ${newMode} (source: ${source})`);
    
    // Use the centralized API mode setter to update mode and trigger events
    setApiMode(newMode as 'live' | 'mock');
    
    // Generate consistent timestamp for all channels
    const timestamp = new Date().toISOString();
    
    // Create the common event payload
    const payload: ApiModePayload = {
      oldMode,
      newMode,
      source,
      timestamp
    };
    
    // 1. Emit on the application event bus for local components
    appEventBus.emit('api_mode_change', payload);
    
    // 2. Try to use BroadcastChannel for modern cross-tab communication
    try {
      const bc = new BroadcastChannel('api_mode_channel');
      bc.postMessage({
        type: 'apiModeChange',
        mode: newMode,
        timestamp,
        preventAutoSync
      });
      setTimeout(() => bc.close(), 100);
    } catch (e) {
      if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] BroadcastChannel not supported in this browser');
    }
    
    if (DEBUG_EVENT_BUS) console.log(`[EVENT_BUS] API mode sync complete: ${oldMode} -> ${newMode}`);
  } catch (e) {
    console.error('[EVENT_BUS] Error syncing API mode:', e);
  }
}

/**
 * Helper function to safely parse JSON
 */
function safeJsonParse(jsonString: string): any | null {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('[EVENT_BUS] Error parsing JSON:', e);
    return null;
  }
}

// --- Cross-tab log event sync ---
if (typeof window !== 'undefined') {
  if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] Setting up localStorage event sync');
  
  // Test localStorage functionality
  try {
    localStorage.setItem('event_bus_test', 'test');
    if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] localStorage test successful');
  } catch (e) {
    console.error('[EVENT_BUS] localStorage test failed:', e);
  }
  
  window.addEventListener('storage', (event) => {
    // Only respond to the master key changes
    if (event.key === 'cms_log_master' && event.newValue) {
      try {
        // Get the actual data from the key that was stored in the master key
        const eventKey = event.newValue;
        const eventData = localStorage.getItem(eventKey);
        
        if (!eventData) {
          console.error(`[EVENT_BUS] No data found for key: ${eventKey}`);
          return;
        }
        
        // Parse the JSON data
        const payload = safeJsonParse(eventData);
        
        if (!payload) {
          console.error('[EVENT_BUS] Failed to parse payload');
          return;
        }
        
        if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] Parsed storage event payload:', payload);
        
        // Skip session timeout events
        if (payload?.message?.includes('Session timeout reset')) {
          return;
        }
        
        // Emit to event bus so CMS/Validation page receives it
        if (payload && 
            typeof payload === 'object' && 
            'level' in payload && 
            'message' in payload && 
            'timestamp' in payload) {
          
          appEventBus.emit('log_event', payload as LogPayload);
        } else {
          console.error('[EVENT_BUS] Invalid payload format:', payload);
        }
      } catch (e) {
        console.error('[EVENT_BUS] Error handling storage event:', e);
      }
    }
    
    // Special handling for API mode change events via storage
    if (event.key === 'apiMode_sync_event' && event.newValue) {
      try {
        const parts = event.newValue.split('_');
        // Format: newMode_timestamp_preventAutoSync
        const newMode = parts[0]; 
        const timestamp = parts[1];
        const preventAutoSync = parts[2] === '1';
        
        if (newMode && (newMode === 'live' || newMode === 'mock')) {
          if (DEBUG_EVENT_BUS) console.log(`[EVENT_BUS] Detected API mode sync event via storage: ${newMode} at ${timestamp}, preventAutoSync: ${preventAutoSync}`);
          
          // Get the current time to check if this is a recent change
          const now = Date.now();
          const eventTime = parseInt(timestamp, 10);
          
          // Only emit if the event is recent (within 5 seconds) and not prevented
          // This prevents old storage events from triggering changes on page load
          if (!isNaN(eventTime) && now - eventTime < 5000 && !preventAutoSync) {
            if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] API mode change is recent and auto-sync allowed, emitting event');
            
            // Emit an API mode change event ON THE EVENT BUS
            const payload: ApiModePayload = {
              oldMode: 'unknown', // We don't know the old mode in this cross-tab context
              newMode,
              source: 'storage_event',
              timestamp: new Date().toISOString()
            };
            appEventBus.emit('api_mode_change', payload);
          } else if (DEBUG_EVENT_BUS) {
            const reason = preventAutoSync ? 'prevented by flag' : 'too old or invalid timestamp';
            console.log(`[EVENT_BUS] API mode change ignored: ${reason}`);
          }
        }
      } catch (e) {
        console.error('[EVENT_BUS] Error handling API mode sync event:', e);
      }
    }
  });
}

// Listen for localStorage API mode changes across tabs
export function setupApiModeSyncListener() {
  if (typeof window === 'undefined') return;
  
  if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] Setting up API mode sync listener');
  
  window.addEventListener('storage', (event) => {
    if (event.key === 'apiMode') {
      try {
        const newMode = event.newValue;
        
        if (newMode === 'live' || newMode === 'mock') {
          if (DEBUG_EVENT_BUS) console.log(`[EVENT_BUS] Storage event detected API mode change: ${newMode}`);
          
          // Create payload for the event bus
          const payload: ApiModePayload = {
            oldMode: event.oldValue || 'unknown',
            newMode,
            source: 'storage_event',
            timestamp: new Date().toISOString()
          };
          
          // Emit on the event bus for local components to react
          appEventBus.emit('api_mode_change', payload);
          if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] Emitted api_mode_change event from storage event');
        }
      } catch (e) {
        console.error('[EVENT_BUS] Error handling API mode sync event:', e);
      }
    }
  });
  
  // Also initialize BroadcastChannel listener for modern browsers
  try {
    const bc = new BroadcastChannel('api_mode_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'apiModeChange' && 
          (event.data.mode === 'live' || event.data.mode === 'mock')) {
        if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] Received BroadcastChannel API mode change:', event.data.mode);
        
        // Only update localStorage if the value is different (prevents loop)
        const currentMode = getApiMode();
        if (currentMode !== event.data.mode) {
          localStorage.setItem('apiMode', event.data.mode);
        }
        
        // Emit on the event bus regardless
        const payload: ApiModePayload = {
          oldMode: currentMode || 'unknown',
          newMode: event.data.mode,
          source: 'broadcast_channel',
          timestamp: new Date().toISOString()
        };
        
        appEventBus.emit('api_mode_change', payload);
      }
    };
    
    if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] BroadcastChannel listener initialized');
  } catch (e) {
    if (DEBUG_EVENT_BUS) console.log('[EVENT_BUS] BroadcastChannel not supported, skipping initialization');
  }
}

// Auto-setup the API mode sync listener when imported on the client
if (typeof window !== 'undefined') {
  setupApiModeSyncListener();
}
