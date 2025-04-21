/**
 * Firestore Patient Seeding Script
 * 
 * This script populates the Firestore 'patients' collection with sample patient data
 * for development and testing purposes.
 * 
 * Usage:
 *   node scripts/seed-patients.js [options]
 * 
 * Options:
 *   --count=N        Number of patients to create (default: 20)
 *   --clear          Clear existing patients before adding new ones
 *   --link-auth-users Link patients to Firebase Auth users (requires seed-users.js to be run first)
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
  } else if (arg === '--link-auth-users') {
    acc.linkAuthUsers = true;
  } else if (arg.startsWith('--count=')) {
    acc.count = parseInt(arg.split('=')[1], 10);
  }
  return acc;
}, { count: 20, clear: false, linkAuthUsers: false, help: false });

// Display help and exit
if (args.help) {
  console.log(`
Firestore Patient Seeding Script

This script populates the Firestore 'patients' collection with sample patient data
for development and testing purposes.

Usage:
  node scripts/seed-patients.js [options]

Options:
  --count=N        Number of patients to create (default: 20)
  --clear          Clear existing patients before adding new ones
  --link-auth-users Link patients to Firebase Auth users (requires seed-users.js to be run first)
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

// Sample data for generating patient profiles
const firstNames = [
  'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jessica',
  'William', 'Jennifer', 'James', 'Linda', 'Richard', 'Patricia', 'Thomas',
  'Elizabeth', 'Charles', 'Mary', 'Daniel', 'Karen'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia',
  'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez',
  'Moore', 'Martin', 'Jackson', 'Thompson', 'White'
];

const genders = ['Male', 'Female', 'Other'];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const medicalHistoryOptions = [
  'No significant medical history',
  'Hypertension',
  'Diabetes Type 2',
  'Asthma',
  'Migraine',
  'Chronic back pain',
  'Allergies',
  'Depression',
  'Anxiety',
  'Hypothyroidism',
  'GERD',
  'Arthritis'
];

// Function to get Firebase Auth user data if available
function getAuthUsers() {
  const usersDataPath = path.resolve('./scripts/userData.json');
  
  if (fs.existsSync(usersDataPath)) {
    try {
      const userData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
      return userData.patients || [];
    } catch (error) {
      console.warn('Warning: Failed to parse user data file:', error.message);
      return [];
    }
  }
  
  return [];
}

// Function to generate a random date of birth (between 18 and 90 years ago)
function generateDateOfBirth() {
  const today = new Date();
  const minAge = 18;
  const maxAge = 90;
  const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  
  const birthYear = today.getFullYear() - randomAge;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1; // Avoid potential day-of-month issues
  
  return new Date(birthYear, birthMonth, birthDay);
}

// Generate random patient data
function generatePatientData(index, authUsers = []) {
  // If we're linking to auth users and there are available auth users, use their data
  let userId = `user_patient_${index + 1}`;
  let firstName = '';
  let lastName = '';
  let email = '';
  let phone = '';
  
  if (args.linkAuthUsers && authUsers.length > 0 && index < authUsers.length) {
    const authUser = authUsers[index];
    userId = authUser.id;
    firstName = authUser.firstName;
    lastName = authUser.lastName;
    email = authUser.email;
    phone = authUser.phoneNumber || `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  } else {
    firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
    phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
  
  const gender = genders[Math.floor(Math.random() * genders.length)];
  const dateOfBirth = generateDateOfBirth();
  const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
  
  // Generate a medical history with 0-3 conditions
  const conditionCount = Math.floor(Math.random() * 4); // 0 to 3 conditions
  const medicalHistory = [];
  for (let i = 0; i < conditionCount; i++) {
    const condition = medicalHistoryOptions[Math.floor(Math.random() * medicalHistoryOptions.length)];
    if (!medicalHistory.includes(condition)) {
      medicalHistory.push(condition);
    }
  }
  
  // If no conditions were added, use the "no significant history" option
  if (medicalHistory.length === 0) {
    medicalHistory.push(medicalHistoryOptions[0]);
  }
  
  return {
    userId,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth: admin.firestore.Timestamp.fromDate(dateOfBirth),
    gender,
    bloodType,
    medicalHistory: medicalHistory.join(', '),
    address: {
      street: `${Math.floor(100 + Math.random() * 9900)} Main St`,
      city: 'Anytown',
      state: 'CA',
      zipCode: `${Math.floor(10000 + Math.random() * 90000)}`
    },
    emergencyContact: {
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      relationship: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend'][Math.floor(Math.random() * 5)],
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Main function to seed patients
async function seedPatients() {
  try {
    const patientsCollection = db.collection('patients');
    
    // Get auth users if linking is requested
    const authUsers = args.linkAuthUsers ? getAuthUsers() : [];
    
    if (args.linkAuthUsers && authUsers.length === 0) {
      console.warn('Warning: --link-auth-users flag is set but no auth users were found.');
      console.warn('Please run seed-users.js first to create Firebase Auth users.');
    }
    
    if (args.linkAuthUsers && authUsers.length < args.count) {
      console.warn(`Warning: Requested ${args.count} patients but only ${authUsers.length} auth users are available.`);
      console.warn(`Only ${authUsers.length} patients will be created with auth links.`);
      args.count = authUsers.length;
    }
    
    // Clear existing patients if requested
    if (args.clear) {
      console.log('Clearing existing patients...');
      const snapshot = await patientsCollection.get();
      
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
      console.log(`Cleared ${snapshot.size} existing patients`);
    }
    
    // Add new patients
    console.log(`Creating ${args.count} patients...`);
    
    const batchSize = 500;
    const batches = [];
    let batch = db.batch();
    let operationCount = 0;
    
    for (let i = 0; i < args.count; i++) {
      const patientData = generatePatientData(i, authUsers);
      
      // If linking to auth users, use the userId as the document ID
      // Otherwise, use auto-generated ID
      const docRef = args.linkAuthUsers && i < authUsers.length
        ? patientsCollection.doc(patientData.userId)
        : patientsCollection.doc();
        
      batch.set(docRef, patientData);
      operationCount++;
      
      if (operationCount >= batchSize) {
        batches.push(batch.commit());
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    if (operationCount > 0) {
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    console.log(`Successfully added ${args.count} patients to Firestore`);
    
  } catch (error) {
    console.error('Error seeding patients:', error);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the seeding function
seedPatients(); 