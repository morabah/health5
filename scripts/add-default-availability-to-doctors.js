/**
 * Script: add-default-availability-to-doctors.js
 * Purpose: For each doctor profile in Firestore, add a default availability array if missing or empty.
 * Usage: node scripts/add-default-availability-to-doctors.js
 *
 * NOTE: Only run this on test/dev data! Will NOT overwrite existing availability arrays with slots.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

function generateDefaultAvailability() {
  const slots = [];
  // Create slots for each day of the week (0 = Sunday, 6 = Saturday)
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    // Morning slots (9am-12pm)
    for (let hour = 9; hour < 12; hour++) {
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true
      });
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isAvailable: true
      });
    }
    // Afternoon slots (1pm-5pm)
    for (let hour = 13; hour < 17; hour++) {
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:30`,
        isAvailable: true
      });
      slots.push({
        dayOfWeek,
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isAvailable: true
      });
    }
  }
  return slots;
}

async function addDefaultAvailabilityToDoctors() {
  const doctorsSnap = await db.collection('doctors').get();
  let updated = 0;
  for (const doc of doctorsSnap.docs) {
    const doctor = doc.data();
    // Only add if missing or empty
    if (!doctor.availability || !Array.isArray(doctor.availability) || doctor.availability.length === 0) {
      const slots = generateDefaultAvailability();
      await db.collection('doctors').doc(doc.id).update({ availability: slots, devAutoPopulated: true });
      console.log(`[UPDATED] Doctor docId: ${doc.id} - Added ${slots.length} default slots.`);
      updated++;
    }
  }
  if (updated === 0) {
    console.log('All doctors already have availability slots.');
  } else {
    console.log(`Added default availability to ${updated} doctors.`);
  }
}

addDefaultAvailabilityToDoctors().catch(e => {
  console.error('Error adding default availability:', e);
  process.exit(1);
});
