/**
 * Script: fix-doctor-availability-dayofweek.js
 * Purpose: Convert all doctor availability slots from explicit `date` to `dayOfWeek` format, matching frontend expectations.
 * Usage: node scripts/fix-doctor-availability-dayofweek.js
 *
 * NOTE: Only run this on test/dev data! Will replace all slots with a `date` field with new slots using `dayOfWeek`.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

function getDayOfWeek(dateString) {
  // dateString: 'YYYY-MM-DD', returns 0=Sunday, 1=Monday, etc.
  const d = new Date(dateString);
  return d.getDay();
}

async function fixDoctorAvailability() {
  const doctorsSnap = await db.collection('doctors').get();
  let fixed = 0;
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    if (!doctor.availability || !Array.isArray(doctor.availability) || doctor.availability.length === 0) continue;
    // Only fix if slots use `date` field
    const needsFix = doctor.availability.some(slot => slot.date);
    if (!needsFix) continue;
    const newSlots = doctor.availability.map(slot => {
      if (slot.date) {
        return {
          dayOfWeek: getDayOfWeek(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable !== false
        };
      } else {
        // Already in correct format
        return slot;
      }
    });
    await db.collection('doctors').doc(doc.id).update({ availability: newSlots, devAutoFixed: true });
    console.log(`[FIXED] Doctor docId: ${doc.id} - Converted ${doctor.availability.length} slots to dayOfWeek.`);
    fixed++;
  }
  if (fixed === 0) {
    console.log('No doctor availability slots needed fixing.');
  } else {
    console.log(`Fixed availability format for ${fixed} doctors.`);
  }
}

fixDoctorAvailability().catch(e => {
  console.error('Error fixing doctor availability:', e);
  process.exit(1);
});
