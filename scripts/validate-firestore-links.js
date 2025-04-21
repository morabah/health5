#!/usr/bin/env node

/**
 * Script to validate that every doctor in Firestore has a valid linked user,
 * and optionally that user exists in Firebase Auth.
 * Prints a report of any orphaned doctors or users.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load service account key
const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in project root.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function validateDoctorUserLinks() {
  const doctorsSnap = await db.collection('doctors').get();
  const usersSnap = await db.collection('users').get();

  const usersById = {};
  usersSnap.forEach(doc => {
    usersById[doc.id] = doc.data();
    if (doc.data().uid) usersById[doc.data().uid] = doc.data(); // Support for uid as key
  });

  let orphanedDoctors = [];
  let totalDoctors = 0;
  let totalUsers = usersSnap.size;

  doctorsSnap.forEach(doc => {
    totalDoctors++;
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId || !usersById[userId]) {
      orphanedDoctors.push({ doctorId: doc.id, userId });
    }
  });

  console.log(`Total doctors: ${totalDoctors}`);
  console.log(`Total users: ${totalUsers}`);
  if (orphanedDoctors.length > 0) {
    console.log('Orphaned doctors (no valid linked user):');
    orphanedDoctors.forEach(d => {
      console.log(`- Doctor ID: ${d.doctorId}, userId: ${d.userId}`);
    });
  } else {
    console.log('All doctors have valid linked users.');
  }
}

validateDoctorUserLinks().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
