/**
 * Firestore Appointment Seeding Script
 * 
 * This script populates the Firestore 'appointments' collection with sample appointment data
 * for development and testing purposes.
 * 
 * Usage:
 *   node scripts/seed-appointments.js [options]
 * 
 * Options:
 *   --count=N        Number of appointments to create (default: 30)
 *   --clear          Clear existing appointments before adding new ones
 *   --help           Display help information
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg === '--help') {
    acc.help = true;
  } else if (arg === '--clear') {
    acc.clear = true;
  } else if (arg.startsWith('--count=')) {
    acc.count = parseInt(arg.split('=')[1], 10);
  }
  return acc;
}, { count: 30, clear: false, help: false });

// Display help and exit
if (args.help) {
  console.log(`
Firestore Appointment Seeding Script

This script populates the Firestore 'appointments' collection with sample appointment data
for development and testing purposes.

Usage:
  node scripts/seed-appointments.js [options]

Options:
  --count=N        Number of appointments to create (default: 30)
  --clear          Clear existing appointments before adding new ones
  --help           Display help information
  `);
  process.exit(0);
}

// Initialize Firebase Admin SDK
try {
  // Look for service account file
  const serviceAccountPath = path.resolve('./service-account-key.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: service-account-key.json not found in project root!');
    console.error('Please create a service account key file and place it in the project root.');
    console.error('See: https://firebase.google.com/docs/admin/setup#initialize-sdk');
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Sample data for appointments
const appointmentReasons = [
  'Annual checkup',
  'Follow-up consultation',
  'New patient consultation',
  'Prescription renewal',
  'Specialist referral',
  'Lab results review',
  'Chronic condition management',
  'Acute illness',
  'Vaccination',
  'Pre-operative assessment'
];

const appointmentNotes = [
  'Patient reported improvement in symptoms',
  'Recommended follow-up in 3 months',
  'Prescribed medication refilled',
  'Ordered additional lab tests',
  'Discussed lifestyle modifications',
  'Referred to specialist',
  'No significant findings',
  'Patient advised to monitor symptoms',
  'Vaccination administered',
  'Surgery scheduled'
];

const appointmentStatuses = [
  'PENDING',
  'CONFIRMED',
  'SCHEDULED',
  'CANCELLED',
  'CANCELLED_BY_PATIENT',
  'CANCELLED_BY_DOCTOR',
  'COMPLETED',
  'NO_SHOW',
  'RESCHEDULED'
];

const appointmentTypes = [
  'In-person',
  'Video'
];

// Function to generate a random future date within the next 3 months
function generateFutureDate() {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + Math.floor(Math.random() * 90)); // Random date within next 90 days
  return futureDate;
}

// Function to generate a random past date within the last 3 months
function generatePastDate() {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 90)); // Random date within past 90 days
  return pastDate;
}

// Generate time slots for a given base hour
function generateTimeSlot(baseHour) {
  const hour = (baseHour % 12) + 9; // Start from 9 AM, wrap around after 12 hours
  const startTime = `${hour.toString().padStart(2, '0')}:00`;
  const endTime = `${hour.toString().padStart(2, '0')}:30`;
  return { startTime, endTime };
}

// Find a suitable time slot from doctor's weekly schedule
function findAvailableTimeSlot(doctor, appointmentDate) {
  if (!doctor.weeklySchedule) {
    return generateTimeSlot(Math.floor(Math.random() * 8)); // Fallback to random time
  }
  
  // Get the day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = appointmentDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  // Get available slots for that day
  const availableSlots = doctor.weeklySchedule[dayName] || [];
  
  if (availableSlots.length === 0) {
    // No slots available that day, generate a random time
    return generateTimeSlot(Math.floor(Math.random() * 8));
  }
  
  // Pick a random slot from available ones
  const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
  return {
    startTime: slot.startTime,
    endTime: slot.endTime
  };
}

// Generate random appointment data
async function generateAppointmentData(index) {
  // Fetch doctors and patients (try to fetch more than needed to get a good mix)
  const limit = Math.max(20, args.count);
  const doctorSnapshot = await db.collection('doctors').limit(limit).get();
  const patientSnapshot = await db.collection('patients').limit(limit).get();
  
  if (doctorSnapshot.empty || patientSnapshot.empty) {
    throw new Error('No doctors or patients found in Firestore. Please seed doctors and patients first.');
  }
  
  const doctors = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const patients = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Pick a random doctor and patient
  const doctor = doctors[Math.floor(Math.random() * doctors.length)];
  const patient = patients[Math.floor(Math.random() * patients.length)];
  
  // Determine if this will be a past or future appointment (70% future, 30% past)
  const isPastAppointment = Math.random() < 0.3;
  const appointmentDate = isPastAppointment ? generatePastDate() : generateFutureDate();
  
  // Find a time slot based on doctor's availability
  const { startTime, endTime } = findAvailableTimeSlot(doctor, appointmentDate);
  
  // Determine status based on date
  let status;
  if (isPastAppointment) {
    status = Math.random() < 0.7 ? 'COMPLETED' : ['CANCELLED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW'][Math.floor(Math.random() * 4)];
  } else {
    status = Math.random() < 0.8 ? 'CONFIRMED' : ['PENDING', 'SCHEDULED', 'RESCHEDULED'][Math.floor(Math.random() * 3)];
  }
  
  const reason = appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)];
  const notes = isPastAppointment ? appointmentNotes[Math.floor(Math.random() * appointmentNotes.length)] : '';
  const appointmentType = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
  
  return {
    patientId: patient.id,
    patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    doctorId: doctor.id,
    doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
    doctorSpecialty: doctor.specialty || 'General Practice',
    appointmentDate: admin.firestore.Timestamp.fromDate(appointmentDate),
    startTime,
    endTime,
    status,
    reason,
    notes,
    appointmentType,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Main function to seed appointments
async function seedAppointments() {
  try {
    const appointmentsCollection = db.collection('appointments');
    
    // Clear existing appointments if requested
    if (args.clear) {
      console.log('Clearing existing appointments...');
      const snapshot = await appointmentsCollection.get();
      
      const batchSize = 500;
      const batches = [];
      let batch = db.batch();
      let operationCount = 0;
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        operationCount++;
        
        if (operationCount >= batchSize) {
          batches.push(batch.commit());
          batch = db.batch();
          operationCount = 0;
        }
      });
      
      if (operationCount > 0) {
        batches.push(batch.commit());
      }
      
      await Promise.all(batches);
      console.log(`Cleared ${snapshot.size} existing appointments`);
    }
    
    // Add new appointments
    console.log(`Creating ${args.count} appointments...`);
    
    // For appointments, we'll do them one by one since each requires fetching random doctors and patients
    for (let i = 0; i < args.count; i++) {
      try {
        const appointmentData = await generateAppointmentData(i);
        await appointmentsCollection.doc().set(appointmentData);
        
        if ((i + 1) % 10 === 0 || i === args.count - 1) {
          console.log(`Progress: ${i + 1}/${args.count} appointments created`);
        }
      } catch (error) {
        console.error(`Error creating appointment ${i + 1}:`, error.message);
      }
    }
    
    console.log(`Successfully added ${args.count} appointments to Firestore`);
  } catch (error) {
    console.error('Error seeding appointments:', error);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the seeding function
seedAppointments(); 