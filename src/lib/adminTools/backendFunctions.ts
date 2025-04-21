import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Creates a core user profile document in Firestore and ensures UID is used as both doc ID and userId field.
 * Returns a summary of the action.
 */
export async function createUserProfileInFirestore(): Promise<string> {
  const uid = `test_user_${Date.now()}`;
  const data = {
    email: `${uid}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    userType: 'PATIENT',
  };
  try {
    await db.collection('users').doc(uid).set({
      id: uid,
      userId: uid,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      userType: data.userType,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return `[CREATED] userId: ${uid}, email: ${data.email}`;
  } catch (error: any) {
    return `[ERROR] Failed to create user profile: ${error.message}`;
  }
}

/**
 * Creates a doctor profile document in Firestore and ensures UID is associated with an existing user.
 * Returns a summary of the action.
 */
export async function createDoctorProfileInFirestore(): Promise<string> {
  const uid = `test_doctor_${Date.now()}`;
  const data = {
    specialty: 'General',
    licenseNumber: `LIC${Date.now()}`,
  };
  try {
    // Ensure user exists first
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        id: uid,
        userId: uid,
        email: `${uid}@test.com`,
        firstName: 'Test',
        lastName: 'Doctor',
        userType: 'DOCTOR',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await db.collection('doctors').doc(uid).set({
      userId: uid,
      specialty: data.specialty,
      licenseNumber: data.licenseNumber,
      verificationStatus: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return `[CREATED] doctorId: ${uid}, userId: ${uid}, specialty: ${data.specialty}`;
  } catch (error: any) {
    return `[ERROR] Failed to create doctor profile: ${error.message}`;
  }
}

/**
 * Creates a patient profile document in Firestore and ensures UID is associated with an existing user.
 * Returns a summary of the action.
 */
export async function createPatientProfileInFirestore(): Promise<string> {
  const uid = `test_patient_${Date.now()}`;
  try {
    // Ensure user exists first
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        id: uid,
        userId: uid,
        email: `${uid}@test.com`,
        firstName: 'Test',
        lastName: 'Patient',
        userType: 'PATIENT',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await db.collection('patients').doc(uid).set({
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return `[CREATED] patientId: ${uid}, userId: ${uid}`;
  } catch (error: any) {
    return `[ERROR] Failed to create patient profile: ${error.message}`;
  }
}
