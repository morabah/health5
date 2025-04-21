import * as admin from 'firebase-admin';
import { db } from '../config/firebaseAdmin';
import { logInfo, logError } from '../shared/logger';

/**
 * Creates a core user profile document in Firestore.
 * Logs only non-sensitive identifiers: uid and userType.
 */
export async function createUserProfileInFirestore(
  uid: string,
  data: { email: string; firstName: string; lastName: string; phone?: string; userType: string }
): Promise<void> {
  const start = Date.now();
  logInfo('[createUserProfile] Starting', { uid, userType: data.userType });
  try {
    await db.collection('users').doc(uid).set({
      id: uid,
      email: data.email,
      phone: data.phone || null,
      firstName: data.firstName,
      lastName: data.lastName,
      userType: data.userType.toUpperCase(), // Always save as uppercase
      isActive: data.userType.toUpperCase() === 'PATIENT',
      emailVerified: false,
      phoneVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const duration = Date.now() - start;
    logInfo('[createUserProfile] Completed', { uid, duration });
  } catch (error) {
    logError('[createUserProfile] Error', { error });
    throw error;
  }
}
