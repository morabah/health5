/**
 * Firestore Audit Script: Verifies existence of required collections and documents.
 * Usage: node scripts/firestore-audit.js
 *
 * Requirements:
 * - You must have @google-cloud/firestore installed (npm i @google-cloud/firestore)
 * - Set GOOGLE_APPLICATION_CREDENTIALS to your service account key, or be authenticated via Firebase CLI
 */

const { Firestore } = require('@google-cloud/firestore');

// Optionally, set projectId here or use GOOGLE_CLOUD_PROJECT env var
const firestore = new Firestore();

// IDs to check (edit as needed)
const doctorIds = [
  'user_doctor_1',
  'user_doctor_2',
  'user_doctor_3',
  'user_doctor_4',
  'user_doctor_5',
];
// Add your actual test UID(s) here:
const userUids = [
  'WRkSVuEF3VcUiUJGVugSvz1WnG62', // Example UID from your logs
];

async function main() {
  console.log('--- Firestore Collections ---');
  const collections = await firestore.listCollections();
  collections.forEach(col => console.log('Collection:', col.id));

  // Check doctors collection
  const doctorsCol = firestore.collection('doctors');
  console.log('\n--- Doctors ---');
  for (const id of doctorIds) {
    const doc = await doctorsCol.doc(id).get();
    if (doc.exists) {
      console.log(`Doctor '${id}': FOUND`);
    } else {
      console.warn(`Doctor '${id}': NOT FOUND`);
    }
  }

  // Check users and profiles collections
  const userCollections = ['users', 'profiles'];
  for (const userColName of userCollections) {
    const userCol = firestore.collection(userColName);
    console.log(`\n--- ${userColName} ---`);
    for (const uid of userUids) {
      const doc = await userCol.doc(uid).get();
      if (doc.exists) {
        console.log(`User '${uid}' in '${userColName}': FOUND`);
      } else {
        console.warn(`User '${uid}' in '${userColName}': NOT FOUND`);
      }
    }
  }
}

main().catch(err => {
  console.error('Firestore audit failed:', err);
  process.exit(1);
});
