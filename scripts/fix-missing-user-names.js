/**
 * Script: fix-missing-user-names.js
 * Purpose: For each doctor profile, ensure the linked user profile has non-empty firstName and lastName fields. If missing, auto-populate with placeholders.
 * Usage: node scripts/fix-missing-user-names.js
 *
 * NOTE: Only run this on test/dev data! Will NOT overwrite non-empty names.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function fixMissingUserNames() {
  const doctorsSnap = await db.collection('doctors').get();
  let fixed = 0;
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId) continue;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) continue;
    const user = userDoc.data();
    let updateNeeded = false;
    let firstName = user.firstName;
    let lastName = user.lastName;
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      // Try to infer from doctor.name or fallback
      firstName = (doctor.name && doctor.name.split(' ')[0]) || 'Test';
      updateNeeded = true;
    }
    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      lastName = (doctor.name && doctor.name.split(' ')[1]) || 'Doctor';
      updateNeeded = true;
    }
    if (updateNeeded) {
      await userRef.update({ firstName, lastName, devAutoFixed: true });
      console.log(`[FIXED] userId: ${userId} -> firstName: ${firstName}, lastName: ${lastName}`);
      fixed++;
    }
  }
  if (fixed === 0) {
    console.log('All user profiles have valid firstName and lastName fields.');
  } else {
    console.log(`Fixed ${fixed} user profiles.`);
  }
}

fixMissingUserNames().catch(e => {
  console.error('Error fixing user names:', e);
  process.exit(1);
});
