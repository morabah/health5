// scripts/list-doctor-ids.js
// List all doctors' Firestore doc IDs, userIds, and names for debugging mapping issues

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in project root.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

async function listDoctorIds() {
  const snapshot = await db.collection('doctors').get();
  if (snapshot.empty) {
    console.log('No doctors found in Firestore.');
    return;
  }
  console.log('Firestore Doctor Document IDs, userIds, and names:');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`FirestoreDocId: ${doc.id} | userId: ${data.userId} | Name: ${data.firstName || ''} ${data.lastName || ''}`);
  });
}

listDoctorIds().then(() => process.exit(0)).catch(err => {
  console.error('Error listing doctor IDs:', err);
  process.exit(1);
});
