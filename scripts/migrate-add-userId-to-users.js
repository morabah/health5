/**
 * Script: migrate-add-userId-to-users.js
 * Description: Adds the missing 'userId' field to all user documents in Firestore (if not present),
 *              setting it to the document ID. This ensures compliance with Zod schemas.
 *
 * Usage:
 *   node scripts/migrate-add-userId-to-users.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

async function main() {
  const snapshot = await db.collection('users').get();
  let updated = 0;
  let skipped = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.userId === 'string' && data.userId.trim() !== '') {
      skipped++;
      continue;
    }
    await db.collection('users').doc(doc.id).update({ userId: doc.id });
    updated++;
    console.log(`Patched user ${doc.id} with userId = ${doc.id}`);
  }
  console.log(`\nMigration complete. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
