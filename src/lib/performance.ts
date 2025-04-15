/**
 * Utility for measuring and logging the performance of code blocks.
 * Usage:
 *   const perf = trackPerformance('myLabel');
 *   ... // code to measure
 *   perf.stop();
 * Logs the duration using the enhanced logger for observability and debugging.
 */
import { logInfo } from './logger';

/**
 * Starts a high-resolution timer for a labeled operation and returns a stop method to log the duration.
 * @param label - A descriptive label for the operation being measured.
 * @returns An object with a stop() method to end timing and log the result.
 */
export function trackPerformance(label: string): { stop: () => void } {
  // Record the start time using the high-resolution timer
  const startTime = performance.now();

  return {
    stop: () => {
      // Calculate duration in milliseconds
      const duration = performance.now() - startTime;
      // Log the performance result using the enhanced logger
      // Includes structured data for downstream analysis
      logInfo(`[PERF] ${label} took ${duration.toFixed(2)} ms`, { label, duration });
    }
  };
}
