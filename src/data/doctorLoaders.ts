/**
 * Doctor-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { getMockDoctorProfiles, getMockDoctorProfile, getMockDoctorAvailability, getMockDoctorForms, getMockDoctorAppointments } from './mockDataService';
import { logInfo, logWarn, logError } from '@/lib/logger';
import type { DoctorProfile } from '@/types/doctor';
import { getFirestoreDb } from '@/lib/improvedFirebaseClient';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Loads all doctors for homepage or search.
 */
export async function loadHomepageDoctors(): Promise<DoctorProfile[]> {
  const label = 'loadHomepageDoctors';
  let mode = 'unknown';
  
  try {
    mode = getApiMode();
    logInfo(`[${label}] start`, { mode });
    console.log(`[${label}] Loading doctors with mode: ${mode}`);
    
    const start = performance.now();

    if (mode === 'mock') {
      // Add a small delay to simulate network request
      await new Promise(res => setTimeout(res, 150));
      
      // Get mock data
      const data = getMockDoctorProfiles();
      console.log(`[${label}] Loaded ${data.length} mock doctor profiles`);
      
      if (!data || data.length === 0) {
        console.warn(`[${label}] Warning: getMockDoctorProfiles returned empty data`);
      }
      
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else if (mode === 'live') {
      logWarn(`[${label}] Live fetch not implemented yet`);
      console.log(`[${label}] Falling back to mock data for 'live' mode`);
      
      // For now, return mock data as fallback until live is implemented
      const fallbackData = getMockDoctorProfiles();
      return fallbackData;
    } else {
      logWarn(`[${label}] Unknown mode: ${mode}, falling back to mock data`);
      return getMockDoctorProfiles();
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logError(`[${label}] Error loading doctors`, { error: errorMsg, mode });
    console.error(`[${label}] Error:`, err);
    
    // Always provide fallback data on error
    try {
      return getMockDoctorProfiles();
    } catch (fallbackErr) {
      console.error(`[${label}] Critical: Even fallback data failed:`, fallbackErr);
      return []; // Empty array as last resort
    }
  } finally {
    const end = performance.now();
    const start = end - 500; // Fallback in case start wasn't properly set
    logInfo(`[${label}] finished`, { duration: end - start, mode });
  }
}

/**
 * Loads a doctor profile by ID (public view).
 */
export async function loadDoctorProfilePublic(id: string): Promise<DoctorProfile | null> {
  const label = 'loadDoctorProfilePublic';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { id, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      const data = getMockDoctorProfile(id);
      logInfo(`[${label}] Loaded mock data`, { found: !!data });
      return data || null;
    } else {
      // Live fetch from Firestore
      try {
        const db = await getFirestoreDb();
        const docRef = doc(db, 'doctors', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          logWarn(`[${label}] No doctor profile found for id: ${id}`);
          return null;
        }
        const data = snap.data();
        const profile: DoctorProfile = {
          // Use the userId stored in Firestore, falling back to the doc id
          userId: (data.userId as string) || snap.id,
          specialty: data.specialty || '',
          licenseNumber: data.licenseNumber || '',
          yearsOfExperience: data.yearsOfExperience || 0,
          education: data.education || '',
          bio: data.bio || '',
          verificationStatus: data.verificationStatus,
          verificationNotes: data.verificationNotes || '',
          location: data.location || '',
          languages: data.languages || [],
          consultationFee: data.consultationFee || 0,
          profilePictureUrl: data.profilePictureUrl || null,
          licenseDocumentUrl: data.licenseDocumentUrl || null,
          certificateUrl: data.certificateUrl || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        logInfo(`[${label}] Loaded live data`, { found: true });
        return profile;
      } catch (err) {
        logWarn(`[${label}] Live fetch error: ${(err as Error).message}`);
        return null;
      }
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return null;
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}

/**
 * Loads doctor availability slots (live).
 */
import { loadDoctorAvailability as loadDoctorAvailabilityLive } from './loadDoctorAvailability';

export async function loadDoctorAvailability(doctorId: string): Promise<any[]> {
  const label = 'loadDoctorAvailability';
  const mode = getApiMode();
  console.log(`[doctorLoaders] API mode: ${mode}, forcing Firestore loader`);
  // Always use Firestore loader for availability
  return await loadDoctorAvailabilityLive(doctorId);
}

/**
 * Loads doctor forms (mock only).
 */
export async function loadDoctorForms(doctorId: string): Promise<any[]> {
  const label = 'loadDoctorForms';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { doctorId, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      const data = getMockDoctorForms();
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
 * Loads doctor appointments (mock only).
 */
export async function loadDoctorAppointments(doctorId: string): Promise<any[]> {
  const label = 'loadDoctorAppointments';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { doctorId, mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      const data = getMockDoctorAppointments();
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
