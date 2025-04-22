import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

async function main() {
  const doctorsSnap = await db.collection('doctors').get();
  let fixedCount = 0;
  for (const doc of doctorsSnap.docs) {
    const data = doc.data();
    // If document is empty or missing required fields, try to fix
    if (!data.userId || !data.firstName || !data.lastName || !data.name || !data.email) {
      // Attempt to infer from Auth
      let userId = data.userId || doc.id;
      let userRecord = null;
      try {
        userRecord = await getAuth().getUser(userId);
      } catch (e) {
        console.warn(`Could not find auth user for doctor doc ${doc.id}`);
        continue;
      }
      const email = userRecord.email || '';
      const displayName = userRecord.displayName || '';
      const [firstName, ...rest] = displayName.split(' ');
      const lastName = rest.join(' ') || 'Doctor';
      const name = displayName || `${firstName} ${lastName}`;
      // You can customize specialty, etc. here if you have a default
      const update: Record<string, any> = {
        userId,
        email,
        firstName: data.firstName || firstName || 'Doctor',
        lastName: data.lastName || lastName || 'User',
        name: data.name || name,
        specialty: data.specialty || 'General Practice',
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await doc.ref.set({ ...data, ...update }, { merge: true });
      fixedCount++;
      console.log(`Fixed doctor profile for doc ${doc.id}`);
    }
  }
  console.log(`Fix complete. ${fixedCount} doctor profiles updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
