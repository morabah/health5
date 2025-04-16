/**
 * Notification-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { logInfo, logWarn } from '@/lib/logger';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

/**
 * Loads notifications for the current user (mock or live).
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
        { id: 'notif1', message: 'You have a new appointment request.', date: '2025-04-16T09:30:00', read: false, type: 'Appointment' },
        { id: 'notif2', message: 'Patient John Doe submitted a new form.', date: '2025-04-15T17:10:00', read: true, type: 'Form' }
      ];
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else {
      // LIVE: Fetch notifications from Firestore
      if (!db) throw new Error('Firestore not initialized');
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logInfo(`[${label}] Loaded live data`, { count: data.length });
      return data;
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return [];
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}
