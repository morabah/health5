/**
 * Notification-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { logInfo, logWarn } from '@/lib/logger';

/**
 * Loads notifications for the current user (mock only).
 */
export async function loadNotifications(userId: string): Promise<any[]> {
  const label = 'loadNotifications';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { userId, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock notifications
      const data = [
        { id: 'notif1', message: 'You have a new appointment request.', date: '2025-04-16T09:30:00', read: false },
        { id: 'notif2', message: 'Patient John Doe submitted a new form.', date: '2025-04-15T17:10:00', read: true }
      ];
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else {
      logWarn(`[${label}] Live fetch not implemented for mode: ${mode}`);
      return [];
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return [];
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}
