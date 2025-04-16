/**
 * Global event bus for app-wide event handling and logging.
 * Allows components and modules to subscribe to and emit events such as logging and validation,
 * supporting debugging, observability, and CMS integration.
 */
import mitt, { Emitter, Handler, EventType } from 'mitt';

// Flag to enable/disable verbose debugging
const DEBUG_EVENT_BUS = true;

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
    console.log(`[EVENT_BUS] Emitting '${type}'`, event);
    return originalEmit(type, event);
  };
}

/**
 * Helper function to set an event in localStorage for cross-tab communication
 */
export function setEventInLocalStorage(payload: LogPayload): void {
  try {
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
    const oldMode = localStorage.getItem('apiMode') || 'mock';
    
    // Only update if the mode is actually changing
    if (newMode === oldMode && source !== 'force_refresh') {
      console.log(`[EVENT_BUS] API mode already set to ${newMode}, not updating`);
      return;
    }
    
    console.log(`[EVENT_BUS] Syncing API mode: ${oldMode} -> ${newMode} (source: ${source})`);
    
    // Update localStorage
    localStorage.setItem('apiMode', newMode);
    
    // Generate consistent timestamp for all channels
    const timestamp = new Date().toISOString();
    
    // Create the common event payload
    const payload: ApiModePayload = {
      oldMode,
      newMode,
      source,
      timestamp
    };
    
    // 1. Emit on the application event bus
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
      console.log('[EVENT_BUS] BroadcastChannel not supported in this browser');
    }
    
    console.log(`[EVENT_BUS] API mode sync complete: ${oldMode} -> ${newMode}`);
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
  console.log('[EVENT_BUS] Setting up localStorage event sync');
  
  // Test localStorage functionality
  try {
    localStorage.setItem('event_bus_test', 'test');
    console.log('[EVENT_BUS] localStorage test successful');
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
        
        console.log('[EVENT_BUS] Parsed storage event payload:', payload);
        
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
          console.log(`[EVENT_BUS] Detected API mode sync event via storage: ${newMode} at ${timestamp}, preventAutoSync: ${preventAutoSync}`);
          
          // Get the current time to check if this is a recent change
          const now = Date.now();
          const eventTime = parseInt(timestamp, 10);
          
          // Only emit if the event is recent (within 5 seconds) and not prevented
          // This prevents old storage events from triggering changes on page load
          if (!isNaN(eventTime) && now - eventTime < 5000 && !preventAutoSync) {
            console.log('[EVENT_BUS] API mode change is recent and auto-sync allowed, emitting event');
            
            // Emit an API mode change event ON THE EVENT BUS
            const payload: ApiModePayload = {
              oldMode: 'unknown', // We don't know the old mode in this cross-tab context
              newMode,
              source: 'storage_event',
              timestamp: new Date().toISOString()
            };
            appEventBus.emit('api_mode_change', payload);
          } else {
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
  
  console.log('[EVENT_BUS] Setting up API mode sync listener');
  
  window.addEventListener('storage', (event) => {
    if (event.key === 'apiMode') {
      try {
        const newMode = event.newValue;
        
        if (newMode === 'live' || newMode === 'mock') {
          console.log(`[EVENT_BUS] Storage event detected API mode change: ${newMode}`);
          
          // Create a timestamp for this event
          const timestamp = new Date().toISOString();
          
          // Check if we should prevent auto-sync
          const preventAutoSync = false; // Default to allowing sync
          
          // Only emit on event bus, as the localStorage is already updated
          if (!preventAutoSync) {
            const payload: ApiModePayload = {
              oldMode: event.oldValue || 'unknown',
              newMode,
              source: 'storage_event',
              timestamp: new Date().toISOString()
            };
            appEventBus.emit('api_mode_change', payload);
          } else {
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
