// scripts/list-doctors-with-availability.js
// Lists all doctors who have at least one available date/slot in Firestore

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in project root.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

async function listDoctorsWithAvailability() {
  const snapshot = await db.collection('doctors').get();
  const doctorsWithAvailability = [];
  snapshot.forEach(doc => {
    const doctor = doc.data();
    if (Array.isArray(doctor.availability) && doctor.availability.length > 0) {
      doctorsWithAvailability.push({
        id: doc.id,
        userId: doctor.userId,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        availableDates: doctor.availableDates || [],
        slotsCount: doctor.availability.length,
      });
    }
  });

  if (doctorsWithAvailability.length === 0) {
    console.log('No doctors with availability found.');
    return;
  }
  console.log('Doctors with availability schedule:');
  doctorsWithAvailability.forEach(doc => {
    console.log(`- ${doc.firstName || ''} ${doc.lastName || ''} (userId: ${doc.userId}) | Slots: ${doc.slotsCount} | Available Dates: ${doc.availableDates.join(', ')}`);
  });
}

listDoctorsWithAvailability().then(() => process.exit(0)).catch(err => {
  console.error('Error listing doctors:', err);
  process.exit(1);
});
