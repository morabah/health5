const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { UserProfileSchema } = require('./zodSchemas');

// Initialize Firebase Admin SDK (make sure GOOGLE_APPLICATION_CREDENTIALS is set)
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

async function fixUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let fixedCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let updateObj = {};
    let needsUpdate = false;

    // Check for missing fields and fix
    ['phone', 'firstName', 'lastName'].forEach(field => {
      if (typeof data[field] !== 'string') {
        updateObj[field] = '';
        needsUpdate = true;
      }
    });

    // Fix userType if needed
    if (typeof data.userType === 'string' && !['PATIENT', 'DOCTOR', 'ADMIN'].includes(data.userType)) {
      const upper = data.userType.toUpperCase();
      if (['PATIENT', 'DOCTOR', 'ADMIN'].includes(upper)) {
        updateObj.userType = upper;
        needsUpdate = true;
      }
    }

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

fixUsers().catch(console.error);
