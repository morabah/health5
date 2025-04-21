/**
 * Script: audit-doctor-user-links.js
 * Purpose: Audits Firestore for doctors whose userId does not have a corresponding user profile with firstName/lastName.
 * Usage: node scripts/audit-doctor-user-links.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function auditDoctorUserLinks() {
  const doctorsSnap = await db.collection('doctors').get();
  const missingUserProfiles = [];
  const missingNames = [];

  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId) {
      missingUserProfiles.push({ doctorId: doc.id, reason: 'No userId in doctor profile' });
      continue;
    }
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      missingUserProfiles.push({ doctorId: doc.id, userId, reason: 'User profile missing' });
    } else {
      const user = userDoc.data();
      if (!user.firstName || !user.lastName) {
        missingNames.push({ doctorId: doc.id, userId, reason: 'Missing firstName or lastName', user });
      }
    }
  }

  console.log('--- Doctors with missing user profiles ---');
  if (missingUserProfiles.length === 0) {
    console.log('All doctors have linked user profiles.');
  } else {
    missingUserProfiles.forEach(item => console.log(item));
  }

  console.log('\n--- Doctors with user profiles missing firstName or lastName ---');
  if (missingNames.length === 0) {
    console.log('All user profiles have firstName and lastName.');
  } else {
    missingNames.forEach(item => console.log(item));
  }
}

auditDoctorUserLinks().catch(e => {
  console.error('Error auditing doctor-user links:', e);
  process.exit(1);
});
