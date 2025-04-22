/**
 * Script: delete-mismatched-users.js
 * Purpose: Delete Firestore user profiles with no matching Firebase Auth user (orphans),
 *          and optionally list Auth users with no Firestore profile.
 * Usage: node scripts/delete-mismatched-users.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();
const auth = getAuth();

async function deleteMismatchedUsers() {
  // Get all Auth users
  const authUsers = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    authUsers.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  const authUids = new Set(authUsers.map(u => u.uid));

  // Get all Firestore user profile docs
  const userDocsSnap = await db.collection('users').get();
  const orphanProfiles = userDocsSnap.docs.filter(doc => !authUids.has(doc.id));

  if (orphanProfiles.length === 0) {
    console.log('No mismatched Firestore user profiles to delete.');
  } else {
    console.log(`Deleting ${orphanProfiles.length} mismatched Firestore user profiles...`);
    for (const doc of orphanProfiles) {
      await db.collection('users').doc(doc.id).delete();
      console.log(`Deleted Firestore user profile: ${doc.id}`);
    }
  }

  // Optionally, list Auth users missing Firestore profiles
  const firestoreUserIds = new Set(userDocsSnap.docs.map(doc => doc.id));
  const missingProfiles = authUsers.filter(user => !firestoreUserIds.has(user.uid));
  if (missingProfiles.length > 0) {
    console.log('\nAuth users missing Firestore profiles:');
    missingProfiles.forEach(u => {
      console.log(`  UID: ${u.uid}, Email: ${u.email}`);
    });
  } else {
    console.log('\nAll Auth users have Firestore profiles.');
  }
}

deleteMismatchedUsers().catch(e => {
  console.error('Error deleting mismatched users:', e);
  process.exit(1);
});
