/**
 * Enhanced logger utility for standardized logging and event emission across the app.
 * Emits log and validation events via the global event bus for observability and CMS integration.
 */
import { appEventBus, AppEvents, LogPayload, ValidationPayload } from './eventBus';

/**
 * Log an info-level message and emit a log_event.
 */
export function logInfo(message: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'INFO';
  // Output to console
  console.info(`[INFO] ${timestamp} - ${message}`); // Info log
  if (data) console.dir(data); // Log data if present
  // Emit event
  const payload: LogPayload = { level, message, data, timestamp };
  appEventBus.emit('log_event', payload); // Broadcast log event
}

/**
 * Log a warning-level message and emit a log_event.
 */
export function logWarn(message: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const level: LogPayload['level'] = 'WARN';
  // Output to console
  console.warn(`[WARN] ${timestamp} - ${message}`); // Warning log
  if (data) console.dir(data); // Log data if present
  // Emit event
  const payload: LogPayload = { level, message, data, timestamp };
  appEventBus.emit('log_event', payload); // Broadcast log event
}

/**
 * Log an error-level message or Error and emit a log_event.
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
  appEventBus.emit('log_event', payload); // Broadcast log event
}

/**
 * Log a debug-level message and emit a log_event if debug is enabled.
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
  appEventBus.emit('log_event', payload); // Broadcast log event
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
  appEventBus.emit('validation_event', payload); // Broadcast validation event
}
