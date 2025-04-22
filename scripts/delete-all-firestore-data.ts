import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const collections = ['users', 'doctors', 'patients', 'appointments', 'notifications'];

// Recursively delete all subcollections and their documents for a given document reference
async function deleteAllSubcollections(docRef: admin.firestore.DocumentReference) {
  const subcollections = await docRef.listCollections();
  for (const sub of subcollections) {
    const subSnap = await sub.get();
    for (const subDoc of subSnap.docs) {
      // Recursively delete subcollections of this subDoc
      await deleteAllSubcollections(subDoc.ref);
      await subDoc.ref.delete();
    }
  }
}

async function deleteCollection(coll: string) {
  const snap = await db.collection(coll).get();
  let deleted = 0;
  for (const doc of snap.docs) {
    await deleteAllSubcollections(doc.ref);
    await doc.ref.delete();
    deleted++;
  }
  console.log(`Deleted ${deleted} documents from ${coll}`);
}

async function main() {
  for (const coll of collections) {
    await deleteCollection(coll);
  }
  console.log('All specified Firestore collections deleted.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
