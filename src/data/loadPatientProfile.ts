import { getPatientDataSource } from '@/config/appConfig';
// import { db } from '@/lib/firebaseClient';
// import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/user';
import { PatientProfile } from '@/types/patient';

/**
 * Loads patient profile from the configured data source (mock or Firestore).
 */
export async function loadPatientProfile(patientId: string): Promise<{ userProfile: UserProfile | null, patientProfile: PatientProfile | null }> {
  const dataSource = getPatientDataSource ? getPatientDataSource() : 'firestore';
  if (dataSource === 'mock') {
    // Mock patient profile
    return {
      userProfile: { id: patientId, name: 'Jane Patient', email: 'jane@example.com', userType: 'PATIENT' },
      patientProfile: { id: patientId, age: 30, gender: 'female', medicalHistory: [] }
    };
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const userDoc = await getDoc(doc(db, 'users', patientId));
  //   const patientDoc = await getDoc(doc(db, 'patients', patientId));
  //   if (!userDoc.exists() || !patientDoc.exists()) {
  //     return { userProfile: null, patientProfile: null };
  //   }
  //   return {
  //     userProfile: userDoc.data() as UserProfile,
  //     patientProfile: patientDoc.data() as PatientProfile,
  //   };
  // }
  throw new Error('No valid data source configured for patient profile.');
}
