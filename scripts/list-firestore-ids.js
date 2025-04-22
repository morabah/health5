/**
 * List all document IDs in the 'doctors' and 'users' collections.
 * Usage: node scripts/list-firestore-ids.js
 *
 * Requires @google-cloud/firestore and appropriate credentials.
 */
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

async function listIds(collectionName) {
  const snapshot = await firestore.collection(collectionName).get();
  const ids = [];
  snapshot.forEach(doc => ids.push(doc.id));
  return ids;
}

(async () => {
  for (const col of ['doctors', 'users']) {
    const ids = await listIds(col);
    console.log(`\nCollection '${col}':`);
    if (ids.length === 0) {
      console.log('  (No documents found)');
    } else {
      ids.forEach(id => console.log('  ', id));
    }
  }
})();
