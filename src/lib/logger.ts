/**
 * Enhanced logger utility for standardized logging and event emission across the app.
 * Emits log and validation events via the global event bus for observability and CMS integration.
 */
import { appEventBus, AppEvents, LogPayload, ValidationPayload } from './eventBus';

// Flag to enable/disable verbose debugging
const DEBUG_LOGGER = true;

/**
 * Sets the given log payload in localStorage for cross-tab communication
 */
function setLogEventInLocalStorage(payload: LogPayload): void {
  try {
    // Only run in browser
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Stringify the payload and add a random ID to force storage event
      const jsonData = JSON.stringify(payload);
      const randomId = Math.random().toString().substring(2);
      localStorage.setItem('cms_log_event', `${jsonData}:${randomId}`);

      if (DEBUG_LOGGER) {
        console.log('[EVENT_BUS] Set localStorage cms_log_event');
      }
    }
  } catch (e) {
    console.error('[EVENT_BUS] Error setting localStorage:', e);
  }
}

/**
 * Log an info-level message and emit a log_event.
 * Also broadcasts the log event to all tabs via localStorage for cross-tab sync.
 */
export function logInfo(message: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'INFO';
  // Output to console
  console.info(`[INFO] ${timestamp} - ${message}`); // Info log
  if (data) console.dir(data); // Log data if present
  // Emit event
  const payload: LogPayload = { level, message, data, timestamp };
  
  if (DEBUG_LOGGER) {
    console.log('[EVENT_BUS] Emitting log_event:', payload);
  }
  
  appEventBus.emit('log_event', payload); // Broadcast log event (in-memory)
  
  // Broadcast log event to other tabs using the helper function
  setLogEventInLocalStorage(payload);
}

/**
 * Log a warning-level message and emit a log_event.
 * Also broadcasts the log event to all tabs via localStorage for cross-tab sync.
 */
export function logWarn(message: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'WARN';
  // Output to console
  console.warn(`[WARN] ${timestamp} - ${message}`); // Warning log
  if (data) console.dir(data); // Log data if present
  // Emit event
  const payload: LogPayload = { level, message, data, timestamp };
  
  if (DEBUG_LOGGER) {
    console.log('[EVENT_BUS] Emitting log_event (WARN):', payload);
  }
  
  appEventBus.emit('log_event', payload); // Broadcast log event
  
  // Broadcast log event to other tabs using the helper function
  setLogEventInLocalStorage(payload);
}

/**
 * Log an error-level message or Error and emit a log_event.
 * Also broadcasts the log event to all tabs via localStorage for cross-tab sync.
 */
export function logError(message: string | Error, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'ERROR';
  let logMsg = message instanceof Error ? message.message : message;
  // Output to console
  if (message instanceof Error) {
    console.error(`[ERROR] ${timestamp} - ${message.message}`); // Error log
    if (data || message.stack) console.dir({ ...(data || {}), stack: message.stack });
  } else {
    console.error(`[ERROR] ${timestamp} - ${message}`); // Error log
    if (data) console.dir(data);
  }
  // Emit event
  const payload: LogPayload = {
    level,
    message: logMsg,
    data: message instanceof Error ? { ...(data || {}), stack: message.stack } : data,
    timestamp,
  };
  
  if (DEBUG_LOGGER) {
    console.log('[EVENT_BUS] Emitting log_event (ERROR):', payload);
  }
  
  appEventBus.emit('log_event', payload); // Broadcast log event
  
  // Broadcast log event to other tabs using the helper function
  setLogEventInLocalStorage(payload);
}

/**
 * Log a debug-level message and emit a log_event if debug is enabled.
 * Also broadcasts the log event to all tabs via localStorage for cross-tab sync.
 */
export function logDebug(message: string, data?: Record<string, any>) {
  // Only log debug if the log level is set
  if (process.env.NEXT_PUBLIC_LOG_LEVEL !== 'debug') return;
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'DEBUG';
  // Output to console
  console.debug(`[DEBUG] ${timestamp} - ${message}`); // Debug log
  if (data) console.dir(data); // Log data if present
  // Emit event
  const payload: LogPayload = { level, message, data, timestamp };
  
  if (DEBUG_LOGGER) {
    console.log('[EVENT_BUS] Emitting log_event (DEBUG):', payload);
  }
  
  appEventBus.emit('log_event', payload); // Broadcast log event
  
  // Broadcast log event to other tabs using the helper function
  setLogEventInLocalStorage(payload);
}

/**
 * Emit a validation event and log the validation result.
 * Used for tracking prompt validation status.
 */
export function logValidation(promptId: string, status: 'success' | 'failure', details?: string) {
  const timestamp = new Date().toISOString();
  const msg = `Validation for prompt ${promptId}: ${status}`;
  if (status === 'success') {
    logInfo(msg, details ? { details } : undefined);
  } else {
    logError(msg, details ? { details } : undefined);
  }
  // Emit validation event
  const payload: ValidationPayload = { promptId, status, details, timestamp };
  
  if (DEBUG_LOGGER) {
    console.log('[EVENT_BUS] Emitting validation_event:', payload);
  }
  
  appEventBus.emit('validation_event', payload); // Broadcast validation event
}
