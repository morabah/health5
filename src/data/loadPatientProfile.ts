import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/user';
import { PatientProfile } from '@/types/patient';

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
 * Loads patient and user profiles from Firestore
 */
export async function loadPatientProfile(patientId: string): Promise<{ userProfile: UserProfile | null; patientProfile: PatientProfile | null }> {
  try {
    const db = await getFirestoreDb();
    const userDoc = await getDoc(doc(db, 'users', patientId));
    const patientDoc = await getDoc(doc(db, 'patients', patientId));
    if (!userDoc.exists() || !patientDoc.exists()) {
      return { userProfile: null, patientProfile: null };
    }
    return {
      userProfile: userDoc.data() as UserProfile,
      patientProfile: patientDoc.data() as PatientProfile,
    };
  } catch (error) {
    console.error('Error loading patient profile from Firestore:', error);
    throw error;
  }
}
