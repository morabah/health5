/**
 * Site info and static content loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { logInfo, logWarn } from '@/lib/logger';

/**
 * Loads site contact info (mock only).
 */
export async function loadContactInfo(): Promise<any> {
  const label = 'loadContactInfo';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock contact info
      const data = { email: 'info@health5.com', phone: '+1-800-555-HEALTH', address: '123 Main St, City, Country' };
      logInfo(`[${label}] Loaded mock data`);
      return data;
    } else {
      logWarn(`[${label}] Live fetch not implemented for mode: ${mode}`);
      return null;
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return null;
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}
