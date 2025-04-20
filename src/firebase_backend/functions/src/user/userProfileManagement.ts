import * as admin from 'firebase-admin';
import { db } from '../config/firebaseAdmin';
import { logInfo, logError } from '../shared/logger';
import { trackPerformance } from '../shared/performance';

/**
 * Fetches combined user profile data (UserProfile + PatientProfile/DoctorProfile) for a given userId.
 * Logs only non-PHI identifiers and profile presence.
 * @param userId - The UID of the authenticated user.
 * @returns Combined profile data or null if no user profile found.
 */
export async function fetchUserProfileData(
  userId: string
): Promise<{
  userProfile: admin.firestore.DocumentData;
  patientProfile?: admin.firestore.DocumentData;
  doctorProfile?: admin.firestore.DocumentData;
} | null> {
  const label = `fetchUserProfileData:${userId}`;
  return trackPerformance(label, async () => {
    logInfo('[fetchUserProfileData] Starting', { userId });
    let userProfileData: admin.firestore.DocumentData | undefined;
    try {
      const snap = await db.collection('users').doc(userId).get();
      if (!snap.exists) {
        logInfo('[fetchUserProfileData] No user document found', { userId });
        return null;
      }
      userProfileData = snap.data();
    } catch (err: any) {
      logError('[fetchUserProfileData] Error fetching user profile', { userId, error: err });
      throw err;
    }
    const result: {
      userProfile: admin.firestore.DocumentData;
      patientProfile?: admin.firestore.DocumentData;
      doctorProfile?: admin.firestore.DocumentData;
    } = { userProfile: userProfileData! };
    // Fetch sub-profile based on userType
    if (userProfileData?.userType === 'PATIENT') {
      try {
        const pSnap = await db.collection('patients').doc(userId).get();
        if (pSnap.exists) result.patientProfile = pSnap.data();
      } catch (err: any) {
        logError('[fetchUserProfileData] Error fetching patient profile', { userId, error: err });
      }
    } else if (userProfileData?.userType === 'DOCTOR') {
      try {
        const dSnap = await db.collection('doctors').doc(userId).get();
        if (dSnap.exists) result.doctorProfile = dSnap.data();
      } catch (err: any) {
        logError('[fetchUserProfileData] Error fetching doctor profile', { userId, error: err });
      }
    }
    logInfo('[fetchUserProfileData] Completed', { userId });
    return result;
  });
}
