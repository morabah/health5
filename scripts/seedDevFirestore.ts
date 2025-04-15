/**
 * Script to seed the live development Firestore with initial mock data.
 * Usage: npm run db:seed:dev
 * 
 * Set your actual dev Firestore URL below
 */
// CommonJS version for Node compatibility
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const {
  mockPatientUser,
  mockDoctorUser,
  mockAdminUser,
  mockPatientProfileData,
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorAvailabilitySlot,
  mockVerificationDocument,
  mockAppointmentsArray,
  mockNotificationsArray,
} = require('./mockDataForScripts');

// Set your actual dev Firestore URL below
const databaseURL = 'https://YOUR_PROJECT_ID.firebaseio.com';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.firestore();

async function main() {
  // USERS
  await Promise.all([
    db.collection('users').doc(mockPatientUser.id).set(mockPatientUser),
    db.collection('users').doc(mockDoctorUser.id).set(mockDoctorUser),
    db.collection('users').doc(mockAdminUser.id).set(mockAdminUser),
  ]);
  console.log('Seeded users');

  // PATIENTS
  await db.collection('patients').doc(mockPatientProfileData.userId).set(mockPatientProfileData);
  console.log('Seeded patient profile');

  // DOCTORS
  await Promise.all([
    db.collection('doctors').doc(mockDoctorProfileData1.userId).set(mockDoctorProfileData1),
    db.collection('doctors').doc(mockDoctorProfileData2.userId).set(mockDoctorProfileData2),
  ]);
  console.log('Seeded doctor profiles');

  // AVAILABILITY (as subcollection)
  if (mockDoctorAvailabilitySlot.id !== undefined) {
    await db.collection('doctors').doc(mockDoctorProfileData1.userId)
      .collection('availability').doc(mockDoctorAvailabilitySlot.id).set(mockDoctorAvailabilitySlot);
    console.log('Seeded doctor availability');
  }

  // VERIFICATION DOCS (as subcollection)
  if (mockVerificationDocument.id !== undefined) {
    await db.collection('doctors').doc(mockDoctorProfileData1.userId)
      .collection('verificationDocs').doc(mockVerificationDocument.id).set(mockVerificationDocument);
    console.log('Seeded doctor verification document');
  }

  // APPOINTMENTS
  await Promise.all(
    mockAppointmentsArray.map((appt: any) =>
      appt.id ? db.collection('appointments').doc(appt.id).set(appt) : Promise.resolve()
    )
  );
  console.log('Seeded appointments');

  // NOTIFICATIONS
  await Promise.all(
    mockNotificationsArray.map((notif: any) =>
      notif.id ? db.collection('notifications').doc(notif.id).set(notif) : Promise.resolve()
    )
  );
  console.log('Seeded notifications');

  console.log('Firestore seeding complete!');
}

main().catch(err => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
