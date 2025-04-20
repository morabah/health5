import * as admin from 'firebase-admin';
import { db } from '../config/firebaseAdmin';
import { logInfo, logError } from '../shared/logger';

/**
 * Creates a patient profile document in Firestore.
 * Logs only non-sensitive identifiers: uid.
 */
export async function createPatientProfileInFirestore(uid: string, data: Record<string, unknown>): Promise<void> {
  const start = Date.now();
  logInfo('[createPatientProfile] Starting', { uid });
  try {
    await db.collection('patients').doc(uid).set({
      userId: uid,
      // Add additional patient-specific fields from data if needed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const duration = Date.now() - start;
    logInfo('[createPatientProfile] Completed', { uid, duration });
  } catch (error) {
    logError('[createPatientProfile] Error', { error });
    throw error;
  }
}
