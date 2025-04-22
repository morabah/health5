/**
 * Script: audit-auth-vs-firestore-users.js
 * Purpose: Audit Firebase Auth users vs Firestore user profiles. Lists Auth users with missing Firestore docs and vice versa.
 * Usage: node scripts/audit-auth-vs-firestore-users.js
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

async function auditUsers() {
  // Get all Auth users
  const authUsers = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    authUsers.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  // Get all Firestore user profile docs
  const userDocsSnap = await db.collection('users').get();
  const firestoreUserIds = new Set(userDocsSnap.docs.map(doc => doc.id));

  // Find Auth users missing Firestore profiles
  const missingProfiles = authUsers.filter(user => !firestoreUserIds.has(user.uid));
  // Find Firestore profiles with no matching Auth user
  const authUids = new Set(authUsers.map(u => u.uid));
  const orphanProfiles = userDocsSnap.docs.filter(doc => !authUids.has(doc.id));

  console.log(`\n=== Audit Report ===`);
  console.log(`Auth users: ${authUsers.length}`);
  console.log(`Firestore user profiles: ${userDocsSnap.size}`);
  console.log(`\nAuth users missing Firestore profiles:`);
  if (missingProfiles.length === 0) {
    console.log('  None!');
  } else {
    missingProfiles.forEach(u => {
      console.log(`  UID: ${u.uid}, Email: ${u.email}`);
    });
  }
  console.log(`\nFirestore user profiles with no matching Auth user:`);
  if (orphanProfiles.length === 0) {
    console.log('  None!');
  } else {
    orphanProfiles.forEach(doc => {
      console.log(`  DocID: ${doc.id}`);
    });
  }
}

auditUsers().catch(e => {
  console.error('Error auditing users:', e);
  process.exit(1);
});
