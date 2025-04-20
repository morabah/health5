import * as functions from 'firebase-functions';

/**
 * Enhanced logger utility for Cloud Functions using firebase-functions.logger.
 * Provides info, warn, error, and debug logging with timestamp and context.
 */
export function logInfo(message: string, data?: unknown) {
  functions.logger.info(`[INFO] ${new Date().toISOString()} | ${message}`, data);
}

export function logWarn(message: string, data?: unknown) {
  functions.logger.warn(`[WARN] ${new Date().toISOString()} | ${message}`, data);
}

export function logError(message: string, data?: unknown) {
  functions.logger.error(`[ERROR] ${new Date().toISOString()} | ${message}`, data);
}

/**
 * Debug logger (always logs in Cloud Functions)
 */
export function logDebug(message: string, data?: unknown) {
  functions.logger.debug(`[DEBUG] ${new Date().toISOString()} | ${message}`, data);
}
