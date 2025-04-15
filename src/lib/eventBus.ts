/**
 * Global event bus for app-wide event handling and logging.
 * Allows components and modules to subscribe to and emit events such as logging and validation,
 * supporting debugging, observability, and CMS integration.
 */
import mitt from 'mitt';

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
