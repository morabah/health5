import * as admin from 'firebase-admin';

function getDayOfWeek(dateString: string): number {
  const d = new Date(dateString);
  return d.getDay();
}

/**
 * Converts all doctor availability slots from explicit `date` to `dayOfWeek` format, matching frontend expectations.
 * Returns a log of all doctor IDs and actions taken.
 */
export async function fixDoctorAvailabilityDayOfWeek(): Promise<string> {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();
  const doctorsSnap = await db.collection('doctors').get();
  let fixed = 0;
  let logs: string[] = [];
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    if (!doctor.availability || !Array.isArray(doctor.availability) || doctor.availability.length === 0) {
      logs.push(`[SKIP] doctorId: ${doc.id} -> No availability slots.`);
      continue;
    }
    const needsFix = doctor.availability.some((slot: any) => slot.date);
    if (!needsFix) {
      logs.push(`[OK] doctorId: ${doc.id} -> All slots already use dayOfWeek.`);
      continue;
    }
    const newSlots = doctor.availability.map((slot: any) => {
      if (slot.date) {
        return {
          dayOfWeek: getDayOfWeek(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable !== false,
        };
      } else {
        return slot;
      }
    });
    await db.collection('doctors').doc(doc.id).update({ availability: newSlots, devAutoFixed: true });
    logs.push(`[FIXED] doctorId: ${doc.id} -> Converted ${doctor.availability.length} slots to dayOfWeek.`);
    fixed++;
  }
  if (logs.length === 0) {
    logs.push('No doctor profiles found.');
  }
  return logs.join('\n');
}
