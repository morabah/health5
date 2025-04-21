/**
 * Script: list-doctors-with-missing-users.js
 * Purpose: Lists all doctor profiles whose userId does NOT match a real user profile in Firestore.
 * Usage: node scripts/list-doctors-with-missing-users.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function listDoctorsWithMissingUsers() {
  const doctorsSnap = await db.collection('doctors').get();
  let missingCount = 0;
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId) {
      console.log(`[NO USERID] Doctor docId: ${doc.id}`);
      missingCount++;
      continue;
    }
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log(`[MISSING USER PROFILE] Doctor docId: ${doc.id} | userId: ${userId} | name: ${doctor.name || ''} | specialty: ${doctor.specialty || ''}`);
      missingCount++;
    }
  }
  if (missingCount === 0) {
    console.log('All doctors have valid linked user profiles.');
  } else {
    console.log(`Total missing or invalid user links: ${missingCount}`);
  }
}

listDoctorsWithMissingUsers().catch(e => {
  console.error('Error listing doctors with missing user profiles:', e);
  process.exit(1);
});
