/**
 * Firestore Doctor Seeding Script
 * 
 * This script populates the Firestore 'doctors' collection with sample doctor data
 * for development and testing purposes.
 * 
 * Usage:
 *   node scripts/seed-doctors.js [options]
 * 
 * Options:
 *   --count=N        Number of doctors to create (default: 10)
 *   --clear          Clear existing doctors before adding new ones
 *   --link-auth-users Link doctors to Firebase Auth users (requires seed-users.js to be run first)
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
}, { count: 10, clear: false, linkAuthUsers: false, help: false });

// Display help and exit
if (args.help) {
  console.log(`
Firestore Doctor Seeding Script

This script populates the Firestore 'doctors' collection with sample doctor data
for development and testing purposes.

Usage:
  node scripts/seed-doctors.js [options]

Options:
  --count=N        Number of doctors to create (default: 10)
  --clear          Clear existing doctors before adding new ones
  --link-auth-users Link doctors to Firebase Auth users (requires seed-users.js to be run first)
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

// Sample data for doctors
const specialties = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
  'Oncology', 
  'Psychiatry',
  'Radiology',
  'General Surgery',
  'Family Medicine',
  'Internal Medicine',
  'Ophthalmology',
  'Urology',
  'Endocrinology',
  'Gastroenterology'
];

const locations = [
  'New York', 
  'San Francisco', 
  'Chicago', 
  'Houston', 
  'Los Angeles',
  'Miami',
  'Boston',
  'Seattle',
  'Denver',
  'Austin'
];

const languages = [
  'English',
  'Spanish',
  'French',
  'Mandarin',
  'Hindi',
  'Portuguese',
  'Arabic',
  'German',
  'Japanese',
  'Russian'
];

const hospitals = [
  'General Hospital',
  'University Medical Center',
  'Memorial Hospital',
  'St. Mary\'s Medical Center',
  'County Regional Hospital',
  'Veterans Hospital',
  'Children\'s Hospital',
  'Medical Institute',
  'Community Health Center',
  'Mercy Hospital'
];

const universities = [
  'Harvard Medical School',
  'Johns Hopkins University',
  'Stanford University School of Medicine',
  'Mayo Clinic School of Medicine',
  'Yale School of Medicine',
  'Columbia University College of Physicians and Surgeons',
  'University of California, San Francisco',
  'University of Pennsylvania Perelman School of Medicine',
  'Duke University School of Medicine',
  'Washington University School of Medicine'
];

const verificationStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

// Function to get Firebase Auth user data if available
function getAuthUsers() {
  const usersDataPath = path.resolve('./scripts/userData.json');
  
  if (fs.existsSync(usersDataPath)) {
    try {
      const userData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
      return userData.doctors || [];
    } catch (error) {
      console.warn('Warning: Failed to parse user data file:', error.message);
      return [];
    }
  }
  
  return [];
}

// Generate random doctor data
function generateDoctorData(index, authUsers = []) {
  // If we're linking to auth users and there are available auth users, use their data
  let userId = `user_doctor_${index + 1}`;
  let firstName = '';
  let lastName = '';
  
  if (args.linkAuthUsers && authUsers.length > 0 && index < authUsers.length) {
    const authUser = authUsers[index];
    userId = authUser.id;
    firstName = authUser.firstName;
    lastName = authUser.lastName;
  } else {
    firstName = ['John', 'Jane', 'Michael', 'Sarah', 'Robert', 'Emily', 'David', 'Maria', 'James', 'Linda', 'Mohammed', 'Chen', 'Raj', 'Fatima', 'Hiroshi'][index % 15];
    lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Patel', 'Kim', 'Lee', 'Nguyen', 'Singh'][index % 15];
  }
  
  const specialty = specialties[index % specialties.length];
  const location = locations[index % locations.length];
  const yearsOfExperience = 3 + Math.floor(Math.random() * 20);
  const ratingValue = 3 + Math.random() * 2; // Rating between 3 and 5
  const rating = parseFloat(ratingValue.toFixed(1));
  const reviewCount = 10 + Math.floor(Math.random() * 90);
  
  // Generate weekly schedule
  const weeklySchedule = {
    monday: generateDaySchedule(9, 17, 30),
    tuesday: generateDaySchedule(9, 17, 30),
    wednesday: generateDaySchedule(9, 17, 30),
    thursday: generateDaySchedule(9, 17, 30),
    friday: generateDaySchedule(9, 17, 30),
    saturday: Math.random() > 0.5 ? generateDaySchedule(10, 14, 30) : [],
    sunday: [] // No appointments on Sunday
  };
  
  // Create education history
  const educationHistory = [
    {
      id: `edu_${index}_1`,
      institution: `${universities[index % universities.length]}`,
      degree: 'MD',
      field: specialty,
      startYear: 2000 - yearsOfExperience,
      endYear: 2004 - yearsOfExperience,
      isOngoing: false
    },
    {
      id: `edu_${index}_2`,
      institution: `${universities[(index + 5) % universities.length]}`,
      degree: 'Residency',
      field: specialty,
      startYear: 2004 - yearsOfExperience,
      endYear: 2008 - yearsOfExperience,
      isOngoing: false
    }
  ];
  
  // Create experience entries
  const experience = [
    {
      id: `exp_${index}_1`,
      organization: `${hospitals[index % hospitals.length]}`,
      position: `${specialty} Specialist`,
      location: location,
      startYear: 2008 - yearsOfExperience,
      endYear: 2015 - yearsOfExperience,
      isOngoing: false,
      description: `Worked as a ${specialty.toLowerCase()} specialist treating patients with various conditions.`
    },
    {
      id: `exp_${index}_2`,
      organization: `${hospitals[(index + 3) % hospitals.length]}`,
      position: `Senior ${specialty} Specialist`,
      location: locations[(index + 2) % locations.length],
      startYear: 2015 - yearsOfExperience,
      endYear: null,
      isOngoing: true,
      description: `Currently serving as a senior ${specialty.toLowerCase()} specialist focusing on complex cases and research.`
    }
  ];
  
  return {
    userId,
    firstName,
    lastName,
    specialty,
    licenseNumber: `DOC${10000 + index}`,
    yearsOfExperience,
    education: `${universities[index % universities.length]}`,
    educationHistory,
    experience,
    bio: `${firstName} ${lastName} is an experienced ${specialty} specialist with ${yearsOfExperience} years of practice. Dedicated to providing high-quality patient care with a personalized approach.`,
    verificationStatus: verificationStatuses[Math.floor(Math.random() * 3)],
    verificationNotes: '',
    location,
    hospital: `${hospitals[index % hospitals.length]}`,
    languages: [
      'English',
      languages[index % languages.length]
    ],
    consultationFee: 100 + (index * 10),
    weeklySchedule,
    profilePictureUrl: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${(index % 50) + 1}.jpg`,
    licenseDocumentUrl: 'https://example.com/license.pdf',
    certificateUrl: 'https://example.com/certificate.pdf',
    specializations: specialty === 'Cardiology' ? ['Heart Disease', 'Hypertension', 'Cardiac Surgery'] :
                     specialty === 'Dermatology' ? ['Acne', 'Skin Cancer', 'Psoriasis'] :
                     specialty === 'Pediatrics' ? ['Child Development', 'Vaccinations', 'Pediatric Nutrition'] :
                     ['General Practice', 'Preventive Medicine'],
    rating,
    reviewCount,
    isAcceptingNewPatients: Math.random() > 0.2, // 80% chance of accepting new patients
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Function to generate a day's schedule with time slots
function generateDaySchedule(startHour, endHour, minuteIncrement) {
  const slots = [];
  
  // 70% chance of having appointments on this day
  if (Math.random() > 0.3) {
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += minuteIncrement) {
        // 60% chance of slot being available
        if (Math.random() > 0.4) {
          slots.push({
            startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            endTime: minute + minuteIncrement >= 60 
              ? `${(hour + 1).toString().padStart(2, '0')}:${((minute + minuteIncrement) - 60).toString().padStart(2, '0')}` 
              : `${hour.toString().padStart(2, '0')}:${(minute + minuteIncrement).toString().padStart(2, '0')}`,
            isAvailable: true
          });
        }
      }
    }
  }
  
  return slots;
}

// Main function to seed doctors
async function seedDoctors() {
  try {
    const doctorsCollection = db.collection('doctors');
    
    // Get auth users if linking is requested
    const authUsers = args.linkAuthUsers ? getAuthUsers() : [];
    
    if (args.linkAuthUsers && authUsers.length === 0) {
      console.warn('Warning: --link-auth-users flag is set but no auth users were found.');
      console.warn('Please run seed-users.js first to create Firebase Auth users.');
    }
    
    if (args.linkAuthUsers && authUsers.length < args.count) {
      console.warn(`Warning: Requested ${args.count} doctors but only ${authUsers.length} auth users are available.`);
      console.warn(`Only ${authUsers.length} doctors will be created with auth links.`);
      args.count = authUsers.length;
    }
    
    // Clear existing doctors if requested
    if (args.clear) {
      console.log('Clearing existing doctors...');
      const snapshot = await doctorsCollection.get();
      
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
      console.log(`Cleared ${snapshot.size} existing doctors`);
    }
    
    // Add new doctors
    console.log(`Creating ${args.count} doctors...`);
    
    const batchSize = 500;
    const batches = [];
    let batch = db.batch();
    let operationCount = 0;
    
    for (let i = 0; i < args.count; i++) {
      const doctorData = generateDoctorData(i, authUsers);
      
      // If linking to auth users, use the userId as the document ID
      // Otherwise, use auto-generated ID
      const docRef = args.linkAuthUsers && i < authUsers.length
        ? doctorsCollection.doc(doctorData.userId)
        : doctorsCollection.doc();
      
      batch.set(docRef, doctorData);
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
    console.log(`Successfully added ${args.count} doctors to Firestore`);
    
  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the seeding function
seedDoctors(); 