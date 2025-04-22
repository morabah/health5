/**
 * Script: clear-all-firestore-data.js
 * Purpose: Delete all documents from main Firestore collections (users, doctors, patients, appointments, notifications, doctorSchedules, verificationDocs).
 * Usage: node scripts/clear-all-firestore-data.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

const collections = [
  'users',
  'doctors',
  'patients',
  'appointments',
  'notifications',
  'doctorSchedules',
  'verificationDocs'
];

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`Collection '${name}' is already empty.`);
    return;
  }
  console.log(`Deleting ${snap.size} docs from '${name}'...`);
  for (const doc of snap.docs) {
    await doc.ref.delete();
  }
  console.log(`Cleared '${name}'.`);
}

async function clearAll() {
  for (const name of collections) {
    await clearCollection(name);
  }
  console.log('All specified collections cleared.');
}

clearAll().catch(e => {
  console.error('Error clearing collections:', e);
  process.exit(1);
});
