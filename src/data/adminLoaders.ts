/**
 * Admin-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { logInfo, logWarn } from '@/lib/logger';

/**
 * Loads pending verifications for admin dashboard (mock only).
 */
export async function loadAdminPendingVerifications(): Promise<any[]> {
  const label = 'loadAdminPendingVerifications';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock pending verifications
      const data = [
        { id: 'verif1', name: 'Dr. Alice Smith', type: 'doctor', submitted: '2025-04-14T10:00:00' },
        { id: 'verif2', name: 'John Doe', type: 'patient', submitted: '2025-04-13T15:20:00' }
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

/**
 * Loads all users for admin dashboard (mock only).
 */
export async function loadAdminUsers(): Promise<any[]> {
  const label = 'loadAdminUsers';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock users
      const data = [
        { id: 'user1', name: 'Dr. Alice Smith', role: 'doctor' },
        { id: 'user2', name: 'John Doe', role: 'patient' },
        { id: 'user3', name: 'Admin Jane', role: 'admin' }
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

// Export a stub for loadAdminDashboardData if missing
export async function loadAdminDashboardData() {
  // TODO: Implement real dashboard data aggregation
  return {
    stats: {},
    users: [],
    verifications: [],
  };
}
