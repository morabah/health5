import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

async function main() {
  const snap = await db.collection('doctors').get();
  console.log(`Doctors collection has ${snap.size} documents.`);
  if (snap.empty) {
    console.log('✅ The doctors collection is EMPTY.');
  } else {
    for (const doc of snap.docs) {
      console.log('Found doctor document:', doc.id);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
