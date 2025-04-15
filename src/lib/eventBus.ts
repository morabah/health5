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
 * Application event map for the event bus.
 */
export type AppEvents = {
  'log_event': LogPayload;
  'validation_event': ValidationPayload;
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
  });
}
