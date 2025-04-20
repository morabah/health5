import { logInfo } from './logger';

/**
 * Tracks and logs the duration of an async operation for Cloud Functions.
 * @param label - Description of the operation
 * @param fn - Async function to measure
 * @returns The result of the async function
 */
export async function trackPerformance<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logInfo(`[Performance] ${label} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logInfo(`[Performance] ${label} failed in ${duration}ms`, error);
    throw error;
  }
}
