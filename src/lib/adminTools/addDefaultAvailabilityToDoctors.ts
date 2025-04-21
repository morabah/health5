import * as admin from 'firebase-admin';

function generateDefaultAvailability() {
  const slots = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (let hour = 9; hour < 12; hour++) {
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true,
      });
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isAvailable: true,
      });
    }
    for (let hour = 13; hour < 17; hour++) {
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true,
      });
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isAvailable: true,
      });
    }
  }
  return slots;
}

/**
 * For each doctor profile in Firestore, add a default availability array if missing or empty.
 * Will NOT overwrite existing availability arrays with slots.
 * Returns a log of all doctor UIDs and actions taken.
 */
export async function addDefaultAvailabilityToDoctors(): Promise<string> {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();
  const doctorsSnap = await db.collection('doctors').get();
  let updated = 0;
  let logs: string[] = [];
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    if (!doctor.availability || !Array.isArray(doctor.availability) || doctor.availability.length === 0) {
      const defaultSlots = generateDefaultAvailability();
      await db.collection('doctors').doc(doc.id).update({ availability: defaultSlots, devAutoFixed: true });
      logs.push(`[FIXED] doctorId: ${doc.id} -> Added default availability (${defaultSlots.length} slots)`);
      updated++;
    } else {
      logs.push(`[OK] doctorId: ${doc.id} -> Already has availability (${doctor.availability.length} slots)`);
    }
  }
  if (logs.length === 0) {
    logs.push('No doctor profiles found.');
  }
  return logs.join('\n');
}
