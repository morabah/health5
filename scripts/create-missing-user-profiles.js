/**
 * Script: create-missing-user-profiles.js
 * Purpose: For each doctor profile whose userId does NOT match a user profile, create a minimal user profile in Firestore for test/dev.
 * Usage: node scripts/create-missing-user-profiles.js
 *
 * NOTE: Only run this on test/dev data! Will NOT overwrite existing user profiles.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function createMissingUserProfiles() {
  const doctorsSnap = await db.collection('doctors').get();
  let created = 0;
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId) {
      console.log(`[NO USERID] Doctor docId: ${doc.id}`);
      continue;
    }
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      // Use fallback values if missing
      const firstName = doctor.firstName || doctor.name?.split(' ')[0] || 'Test';
      const lastName = doctor.lastName || doctor.name?.split(' ')[1] || 'Doctor';
      const specialty = doctor.specialty || 'General';
      await db.collection('users').doc(userId).set({
        firstName,
        lastName,
        role: 'DOCTOR',
        specialty,
        email: `${userId}@example.com`,
        createdAt: new Date(),
        devAutoCreated: true
      });
      console.log(`[CREATED] User profile for userId: ${userId} (Doctor: ${doctor.name || ''})`);
      created++;
    }
  }
  if (created === 0) {
    console.log('No missing user profiles needed to be created.');
  } else {
    console.log(`Created ${created} missing user profiles.`);
  }
}

createMissingUserProfiles().catch(e => {
  console.error('Error creating missing user profiles:', e);
  process.exit(1);
});
