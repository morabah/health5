/**
 * Migration script: Adds userId to doctorVerifications documents if missing, using doctorId as fallback.
 * Usage: npx tsx ./scripts/fix-doctor-verifications-add-userId.ts
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- CONFIGURE THIS ---
// You must set GOOGLE_APPLICATION_CREDENTIALS or use service account credentials for admin SDK

async function main() {
  if (!getApps().length) {
    initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS env var
  }
  const db = getFirestore();
  const collectionRef = db.collection('doctorVerifications');
  const snapshot = await collectionRef.get();

  let updated = 0, skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.userId && data.doctorId) {
      await doc.ref.update({ userId: data.doctorId });
      console.log(`Updated doc ${doc.id}: set userId = doctorId (${data.doctorId})`);
      updated++;
    } else {
      skipped++;
    }
  }
  console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
