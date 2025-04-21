import * as admin from 'firebase-admin';
import { db } from '../config/firebaseAdmin';
import { logInfo, logError } from './logger';
import { UserType } from '../types/enums';

/**
 * Returns the userType ('PATIENT' | 'DOCTOR') for a given userId (uid).
 * Throws if user profile is missing or invalid.
 * @param uid - Firebase Auth UID
 * @returns UserType
 */
export async function getUserTypeFromAuth(uid: string): Promise<UserType> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      logError('[getUserTypeFromAuth] User profile not found', { uid });
      throw new Error('User profile not found');
    }
    const userType = userDoc.get('userType');
    logInfo('[getUserTypeFromAuth] userType fetched', { uid, userType });
    if (!userType || (userType !== 'PATIENT' && userType !== 'DOCTOR')) {
      logError(`[getUserTypeFromAuth] Invalid userType: ${userType}`, { uid, userType });
      throw new Error('Invalid userType');
    }
    return userType as UserType;
  } catch (err) {
    logError('[getUserTypeFromAuth] Exception', { uid, err });
    throw err;
  }
}
