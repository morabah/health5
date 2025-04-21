import * as admin from 'firebase-admin';

/**
 * Ensures all doctor-linked user profiles in Firestore have valid firstName and lastName fields.
 * Auto-populates missing/empty names with sensible placeholders (inferred from doctor profile or fallback).
 * Returns a summary log of all user UIDs and their names (even if not changed).
 *
 * @returns {Promise<string>} Log of actions performed
 */
export async function fixMissingUserNames(): Promise<string> {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();
  const doctorsSnap = await db.collection('doctors').get();
  let fixed = 0;
  let logs: string[] = [];
  let seenUserIds = new Set<string>();
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    const userId = doctor.userId;
    if (!userId || seenUserIds.has(userId)) continue;
    seenUserIds.add(userId);
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) continue;
    const user = userDoc.data();
    let updateNeeded = false;
    let firstName = user.firstName;
    let lastName = user.lastName;
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      firstName = (doctor.name && doctor.name.split(' ')[0]) || 'Test';
      updateNeeded = true;
    }
    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      lastName = (doctor.name && doctor.name.split(' ')[1]) || 'Doctor';
      updateNeeded = true;
    }
    if (updateNeeded) {
      await userRef.update({ firstName, lastName, devAutoFixed: true });
      logs.push(`[FIXED] userId: ${userId} -> firstName: ${firstName}, lastName: ${lastName}`);
      fixed++;
    } else {
      logs.push(`[OK] userId: ${userId} -> firstName: ${firstName}, lastName: ${lastName}`);
    }
  }
  if (logs.length === 0) {
    logs.push('No doctor-linked user profiles found.');
  }
  return logs.join('\n');
}
