import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Ensures every doctor and patient profile has a corresponding user profile with matching UID.
 * If not, creates the user with sensible defaults and logs the action taken.
 * Returns a log of all actions performed.
 */
export async function fixUserUidAssociations(): Promise<string> {
  let logs: string[] = [];
  // Check doctors
  const doctorSnap = await db.collection('doctors').get();
  for (const doc of doctorSnap.docs) {
    const doctor = doc.data();
    const uid = doctor.userId || doc.id;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        id: uid,
        userId: uid,
        email: `${uid}@autofix.com`,
        firstName: doctor.firstName || 'Auto',
        lastName: doctor.lastName || 'Doctor',
        userType: 'DOCTOR',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logs.push(`[FIXED] Created user for doctorId: ${doc.id}, userId: ${uid}`);
    } else {
      logs.push(`[OK] User exists for doctorId: ${doc.id}, userId: ${uid}`);
    }
  }
  // Check patients
  const patientSnap = await db.collection('patients').get();
  for (const doc of patientSnap.docs) {
    const patient = doc.data();
    const uid = patient.userId || doc.id;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        id: uid,
        userId: uid,
        email: `${uid}@autofix.com`,
        firstName: patient.firstName || 'Auto',
        lastName: patient.lastName || 'Patient',
        userType: 'PATIENT',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logs.push(`[FIXED] Created user for patientId: ${doc.id}, userId: ${uid}`);
    } else {
      logs.push(`[OK] User exists for patientId: ${doc.id}, userId: ${uid}`);
    }
  }
  if (logs.length === 0) {
    logs.push('No doctor or patient profiles found.');
  }
  return logs.join('\n');
}
