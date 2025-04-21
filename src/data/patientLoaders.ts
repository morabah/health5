/**
 * Patient-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { 
  getMockPatientUser, 
  getMockPatientProfileData1, 
  getMockAppointments 
} from './mockDataService';
import { logInfo, logWarn, logError } from '@/lib/logger';
import { initializeFirebaseClient } from '@/lib/firebaseClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Appointment } from '@/types/appointment';

/**
 * Loads patient profile (mock only).
 */
export async function loadPatientProfile(patientId: string): Promise<any> {
  const label = 'loadPatientProfile';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { patientId, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      try {
        const user = getMockPatientUser();
        const profile = getMockPatientProfileData1();
        logInfo(`[${label}] Loaded mock data`);
        return { user, profile };
      } catch (err) {
        logWarn(`[${label}] Error with mock data, creating fallback:`, { error: err instanceof Error ? err.message : String(err) });
        // Provide a fallback if the mock functions fail
        return {
          user: {
            id: 'fallback_user',
            firstName: 'Fallback',
            lastName: 'User',
            email: 'fallback@example.com'
          },
          profile: {
            userId: 'fallback_user',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Unspecified',
            bloodType: 'Unknown'
          }
        };
      }
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

/**
 * Loads patient appointments (mock only).
 */
export async function loadPatientAppointments(patientId: string): Promise<Appointment[]> {
  const label = 'loadPatientAppointments';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { patientId, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      const data = getMockAppointments();
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else {
      // Live mode: fetch appointments from Firestore
      logInfo(`[${label}] Live mode - fetching appointments from Firestore`, { patientId });
      const { db } = initializeFirebaseClient(mode);
      if (!db) {
        logError(`[${label}] No Firestore database instance available`);
        return [];
      }
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, where('patientId', '==', patientId));
      const snapshot = await getDocs(q);
      const data: Appointment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Appointment, 'id'>)
      }));
      logInfo(`[${label}] Loaded live data from Firestore`, { count: data.length });
      return data;
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return [];
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}
