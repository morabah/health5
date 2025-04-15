const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { UserProfileSchema } = require('./zodSchemas');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

async function fixUsersBooleans() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let fixedCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let updateObj = {};
    let needsUpdate = false;

    // Set id to Firestore doc ID if missing
    if (typeof data.id !== 'string') {
      updateObj.id = doc.id;
      needsUpdate = true;
    }
    // Set missing booleans to false
    ['isActive', 'emailVerified', 'phoneVerified'].forEach(field => {
      if (typeof data[field] !== 'boolean') {
        updateObj[field] = false;
        needsUpdate = true;
      }
    });

    // Validate after fix
    const result = UserProfileSchema.safeParse({ ...data, ...updateObj });
    if (!result.success) {
      errorCount++;
      console.log(`[SKIP] User ${doc.id} still invalid after attempted fix:`, result.error.issues);
      continue;
    }

    // Apply fix
    if (needsUpdate) {
      await doc.ref.update(updateObj);
      fixedCount++;
      console.log(`[FIXED] User ${doc.id} updated:`, updateObj);
    }
  }

  console.log(`Done. Fixed: ${fixedCount}, Skipped (still invalid): ${errorCount}`);
}

fixUsersBooleans().catch(console.error);
