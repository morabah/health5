import * as admin from 'firebase-admin';
import { db } from '../config/firebaseAdmin';
import { logInfo, logError } from '../shared/logger';

/**
 * Creates a doctor profile document in Firestore.
 * Logs only non-sensitive identifiers: uid.
 */
export async function createDoctorProfileInFirestore(uid: string, data: { specialty?: string; licenseNumber?: string }): Promise<void> {
  const start = Date.now();
  logInfo('[createDoctorProfile] Starting', { uid });
  try {
    await db.collection('doctors').doc(uid).set({
      userId: uid,
      specialty: data.specialty || null,
      licenseNumber: data.licenseNumber || null,
      verificationStatus: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const duration = Date.now() - start;
    logInfo('[createDoctorProfile] Completed', { uid, duration });
  } catch (error) {
    logError('[createDoctorProfile] Error', { error });
    throw error;
  }
}
