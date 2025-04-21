import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  bio: string;
}

/**
 * Gets a properly initialized Firebase Firestore instance
 */
async function getFirestoreDb() {
  const { db } = initializeFirebaseClient('live');
  if (!db) {
    throw new Error('Firebase Firestore is not available');
  }
  return db;
}

/**
 * Loads the doctor profile from Firestore
 * @param userId Doctor user ID
 * @returns The doctor profile data
 */
export async function loadDoctorProfile(userId: string): Promise<DoctorProfile> {
  try {
    const db = await getFirestoreDb();
    const ref = doc(db, 'doctors', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error(`Doctor profile not found for ID: ${userId}`);
    }
    const data = snap.data();
    return {
      id: snap.id,
      name: `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email || '',
      phone: data.phone || '',
      specialty: data.specialty || '',
      location: data.location || '',
      bio: data.bio || ''
    };
  } catch (error) {
    console.error('Error loading doctor profile from Firestore:', error);
    throw error;
  }
}
