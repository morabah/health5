#!/usr/bin/env node

/**
 * Firebase Firestore Comprehensive Seeding Script
 * 
 * This script populates Firebase Firestore with interconnected sample data
 * across multiple collections for development and testing purposes.
 */

const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');
const { parse } = require('path');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const minimist = require('minimist');

// Get command line arguments
const args = minimist(process.argv.slice(2), {
  string: ['collections', 'counts'],
  boolean: ['clear', 'help'],
  alias: {
    h: 'help',
    c: 'collections',
    n: 'counts',
    d: 'clear'
  }
});

// Help flag
if (args.help) {
  console.log(`
  Firebase Seeding Script

  Options:
    --collections=users,doctors,patients,appointments,notifications
                                  Collections to seed (comma-separated)
    --counts=users:10,doctors:15  Number of documents to create per collection
    --clear                       Clear existing data before adding new ones
    --help                        Display this help message
  
  Examples:
    node seed-firebase.js
    node seed-firebase.js --collections=doctors,patients --clear
    node seed-firebase.js --counts=doctors:30,patients:20
  `);
  process.exit(0);
}

// Parse collections
let collections = (args.collections || 'users,doctors,patients,doctorSchedules,appointments,notifications,verificationDocs,doctorVerifications').split(',');

// Parse counts
const countsInput = args.counts || '';
const countsMap = {};
countsInput.split(',').forEach(item => {
  const [collection, count] = item.split(':');
  if (collection && count) {
    countsMap[collection] = parseInt(count, 10);
  }
});

// Default counts per collection
const DEFAULT_COUNTS = {
  users: 15,
  doctors: 15,
  patients: 30,
  appointments: 50,
  notifications: 20,
  doctorSchedules: 15,
  verificationDocs: 30,
  doctorVerifications: 1
};

// Initialize Firebase
try {
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: service-account-key.json not found in project root.');
    console.log('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

const db = admin.firestore();

// Data generators
const generators = {
  // Generate a user document
  users: () => {
    // Only allow the admin@example.com as admin, others as doctor or patient
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    let userType = faker.helpers.arrayElement(['DOCTOR', 'PATIENT']);
    let roles = { [userType]: true };
    // Only one admin
    if (email === 'admin@example.com') {
      userType = 'ADMIN';
      roles = { admin: true };
    }
    // Ensure Zod compatibility: id, userType, isActive, emailVerified, phoneVerified, createdAt, updatedAt, firstName, lastName, phone
    return {
      id: uuidv4(),
      email,
      phone: faker.phone.number(),
      firstName,
      lastName,
      userType,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
      updatedAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate a doctor document
  doctors: (users) => {
    let userId = uuidv4();
    let user = null;
    if (users && users.length > 0) {
      const doctorUsers = users.filter(u => u.userType === 'DOCTOR');
      if (doctorUsers.length > 0) {
        user = faker.helpers.arrayElement(doctorUsers);
        userId = user.id;
      }
    }
    // Ensure Zod compatibility: userId, specialty, licenseNumber, yearsOfExperience, education, bio, verificationStatus, verificationNotes, location, languages, consultationFee, profilePictureUrl, licenseDocumentUrl, certificateUrl, createdAt, updatedAt
    return {
      userId,
      specialty: faker.helpers.arrayElement([
        'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
        'Neurology', 'Obstetrics', 'Oncology', 'Ophthalmology', 'Pediatrics',
        'Psychiatry', 'Radiology', 'Surgery', 'Urology', 'Family Medicine'
      ]),
      licenseNumber: faker.string.alphanumeric(10),
      yearsOfExperience: faker.number.int({ min: 1, max: 30 }),
      education: `${faker.helpers.arrayElement(['MD', 'PhD', 'DO', 'MBBS'])}, ${faker.company.name()} Medical School`,
      bio: faker.lorem.paragraph(3),
      verificationStatus: faker.helpers.arrayElement(['PENDING','VERIFIED','REJECTED']),
      verificationNotes: '',
      location: 'Main Clinic',
      languages: ['English'],
      consultationFee: faker.number.int({ min: 0, max: 100 }),
      profilePictureUrl: null,
      licenseDocumentUrl: null,
      certificateUrl: null,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
      updatedAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate a patient document
  patients: (users) => {
    let userId = uuidv4();
    let user = null;
    if (users && users.length > 0) {
      const patientUsers = users.filter(u => u.userType === 'PATIENT');
      if (patientUsers.length > 0) {
        user = faker.helpers.arrayElement(patientUsers);
        userId = user.id;
      }
    }
    // Ensure Zod compatibility: userId, dateOfBirth, gender, bloodType, medicalHistory, createdAt, updatedAt
    const dob = faker.date.birthdate();
    return {
      userId,
      dateOfBirth: admin.firestore.Timestamp.fromDate(dob),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
      bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
      medicalHistory: faker.lorem.sentence(),
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
      updatedAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate an appointment document
  appointments: (doctors, patients) => {
    if (!doctors || doctors.length === 0 || !patients || patients.length === 0) {
      throw new Error('Cannot create appointments without doctors and patients');
    }
    const doctor = faker.helpers.arrayElement(doctors);
    const patient = faker.helpers.arrayElement(patients);
    const date = faker.date.soon({ days: 30 });
    const appointmentDate = admin.firestore.Timestamp.fromDate(date);
    const startTime = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    const endDate = new Date(date.getTime() + 30 * 60000);
    const endTime = `${endDate.getHours().toString().padStart(2,'0')}:${endDate.getMinutes().toString().padStart(2,'0')}`;
    const status = faker.helpers.arrayElement(['PENDING','CONFIRMED','CANCELLED','COMPLETED']);
    const reason = faker.lorem.sentence();
    return {
      id: uuidv4(),
      patientId: patient.userId,
      doctorId: doctor.userId,
      appointmentDate,
      startTime,
      endTime,
      status,
      reason,
      notes: '',
      appointmentType: faker.helpers.arrayElement(['In-person','Video']),
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent()),
      updatedAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate a notification document
  notifications: (users, appointments) => {
    if (!users || users.length === 0) {
      throw new Error('Cannot create notifications without users');
    }
    
    const user = faker.helpers.arrayElement(users);
    
    const notificationTypes = [
      'appointment_reminder',
      'new_message',
      'appointment_cancelled',
      'payment_received',
      'prescription_ready',
      'test_results_ready'
    ];
    
    const type = faker.helpers.arrayElement(notificationTypes);
    let content = '';
    let relatedId = null;
    
    switch (type) {
      case 'appointment_reminder':
        if (appointments && appointments.length) {
          const appointment = faker.helpers.arrayElement(appointments);
          content = `Reminder: You have an appointment scheduled for ${appointment.appointmentDate.toDate().toLocaleString()}`;
          relatedId = appointment.id;
        } else {
          content = `Reminder: You have an upcoming appointment`;
        }
        break;
      case 'new_message':
        content = `You have a new message from ${faker.person.fullName()}`;
        break;
      case 'appointment_cancelled':
        content = `An appointment has been cancelled`;
        break;
      case 'payment_received':
        content = `Payment of $${faker.number.int({ min: 50, max: 300 })} has been received`;
        break;
      case 'prescription_ready':
        content = `Your prescription is ready for pickup`;
        break;
      case 'test_results_ready':
        content = `Your test results are now available`;
        break;
    }
    
    const title = type;
    const message = content;
    return {
      id: uuidv4(),
      userId: user.id,
      type,
      title,
      message,
      isRead: faker.datatype.boolean(0.3),
      relatedId,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  }
};

// Clear existing data in specified collections
async function clearCollections() {
  console.log('Clearing existing data...');
  
  for (const collection of collections) {
    try {
      const snapshot = await db.collection(collection).get();
      
      const batchSize = 500;
      const batches = [];
      let batch = db.batch();
      let operationCount = 0;
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        operationCount++;
        
        if (operationCount === batchSize) {
          batches.push(batch.commit());
          batch = db.batch();
          operationCount = 0;
        }
      });
      
      if (operationCount > 0) {
        batches.push(batch.commit());
      }
      
      await Promise.all(batches);
      console.log(`Cleared ${snapshot.size} documents from '${collection}' collection`);
    } catch (error) {
      console.error(`Error clearing collection '${collection}':`, error);
    }
  }
}

// --- Create or update known test users in Firebase Auth as well ---
async function ensureAuthUser(email, password, displayName, role) {
  try {
    // Try to get user by email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
      // If not found, create
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: false
      });
    }
    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    return userRecord.uid;
  } catch (error) {
    console.error(`Error ensuring auth user for ${email}:`, error);
    return null;
  }
}

// Seed data
async function seedData() {
  console.log('Seeding data...');

  // Calculate counts for each collection
  const counts = {};
  for (const collection of collections) {
    counts[collection] = countsMap[collection] || DEFAULT_COUNTS[collection] || 10;
  }

  // Create documents in order (for proper references)
  const createdData = {};
  const summary = { users: 0, doctors: 0, patients: 0, appointments: 0, notifications: 0, doctorSchedules: 0, verificationDocs: 0, doctorVerifications: 0, errors: [] };

  // 1. Create users first
  if (collections.includes('users')) {
    const users = [];
    // Insert known test users
    const knownTestUsers = [
      {
        email: 'admin@example.com',
        password: 'Password123!',
        displayName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN',
        role: 'ADMIN'
      },
      {
        email: 'doctor1@example.com',
        password: 'Password123!',
        displayName: 'Doctor One',
        firstName: 'Doctor',
        lastName: 'One',
        userType: 'DOCTOR',
        role: 'DOCTOR'
      },
      {
        email: 'patient1@example.com',
        password: 'Password123!',
        displayName: 'Patient One',
        firstName: 'Patient',
        lastName: 'One',
        userType: 'PATIENT',
        role: 'PATIENT'
      }
    ];
    for (const userData of knownTestUsers) {
      const uid = await ensureAuthUser(userData.email, userData.password, userData.displayName, userData.role);
      if (!uid) continue;
      const firestoreUser = {
        id: uid,
        email: userData.email,
        phone: faker.phone.number(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      };
      users.push(firestoreUser);
      try {
        await db.collection('users').doc(uid).set(firestoreUser);
      } catch (error) {
        console.error(`Error creating known user document:`, error);
        summary.errors.push(`Known user ${uid}: ${error.message}`);
      }
    }
    // Now create the rest as before (subtracting known users from count)
    const remaining = counts.users - knownTestUsers.length;
    for (let i = 0; i < remaining; i++) {
      const userData = generators.users();
      users.push(userData);
      try {
        await db.collection('users').doc(userData.id).set(userData);
      } catch (error) {
        console.error(`Error creating user document:`, error);
        summary.errors.push(`User ${userData.id}: ${error.message}`);
      }
    }
    createdData.users = users;
    summary.users = users.length;
    console.log(`Created ${users.length} users`);
  }

  // 2. Create doctors
  if (collections.includes('doctors')) {
    const doctors = [];
    console.log(`Creating ${counts.doctors} doctors...`);
    const doctorUsers = (createdData.users || []).filter(u => u.userType === 'DOCTOR');
    const numToCreate = Math.min(counts.doctors, doctorUsers.length);
    if (doctorUsers.length === 0) {
      const msg = `No users with doctor role found. No doctors will be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    } else if (numToCreate < counts.doctors) {
      const msg = `Warning: Requested ${counts.doctors} doctors but only ${doctorUsers.length} users with doctor role are available. Only ${numToCreate} doctors will be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    }
    for (let i = 0; i < numToCreate; i++) {
      const user = doctorUsers[i];
      const doctorData = generators.doctors([user]);
      doctorData.userId = user.id;
      doctors.push(doctorData);
      try {
        await db.collection('doctors').doc(doctorData.userId).set(doctorData);
      } catch (error) {
        console.error(`Error creating doctor document:`, error);
        summary.errors.push(`Doctor ${doctorData.userId}: ${error.message}`);
      }
    }
    createdData.doctors = doctors;
    summary.doctors = doctors.length;
    console.log(`Created ${doctors.length} doctors`);
  }

  // 3. Create patients
  if (collections.includes('patients')) {
    const patients = [];
    console.log(`Creating ${counts.patients} patients...`);
    const patientUsers = (createdData.users || []).filter(u => u.userType === 'PATIENT');
    const numToCreate = Math.min(counts.patients, patientUsers.length);
    if (patientUsers.length === 0) {
      const msg = `No users with patient role found. No patients will be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    } else if (numToCreate < counts.patients) {
      const msg = `Warning: Requested ${counts.patients} patients but only ${patientUsers.length} users with patient role are available. Only ${numToCreate} patients will be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    }
    for (let i = 0; i < numToCreate; i++) {
      const user = patientUsers[i];
      const patientData = generators.patients([user]);
      patientData.userId = user.id;
      patients.push(patientData);
      try {
        await db.collection('patients').doc(patientData.userId).set(patientData);
      } catch (error) {
        console.error(`Error creating patient document:`, error);
        summary.errors.push(`Patient ${patientData.userId}: ${error.message}`);
      }
    }
    createdData.patients = patients;
    summary.patients = patients.length;
    console.log(`Created ${patients.length} patients`);
  }

  // 4. Create doctorSchedules (availability)
  if (collections.includes('doctorSchedules')) {
    const schedules = [];
    console.log(`Creating doctorSchedules for ${createdData.doctors.length} doctors...`);
    for (const doctor of createdData.doctors) {
      const slots = generateDefaultAvailability();
      const scheduleData = { doctorId: doctor.userId, slots };
      schedules.push(scheduleData);
      await db.collection('doctorSchedules').doc(doctor.userId).set(scheduleData);
    }
    summary.doctorSchedules = schedules.length;
    createdData.doctorSchedules = schedules;
  }

  // 5. Create appointments (requires doctors & patients)
  if (collections.includes('appointments')) {
    const appointments = [];
    if (!createdData.doctors || createdData.doctors.length === 0 || !createdData.patients || createdData.patients.length === 0) {
      const msg = `No doctors or patients found in Firestore. Appointments will not be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    } else {
      console.log(`Creating ${counts.appointments} appointments...`);
      for (let i = 0; i < counts.appointments; i++) {
        try {
          const appointmentData = generators.appointments(createdData.doctors, createdData.patients);
          appointments.push(appointmentData);
          await db.collection('appointments').doc().set(appointmentData);
        } catch (error) {
          console.error(`Error creating appointment:`, error);
          summary.errors.push(`Appointment: ${error.message}`);
        }
      }
      summary.appointments = appointments.length;
      createdData.appointments = appointments;
      console.log(`Created ${appointments.length} appointments`);
    }
  }

  // 6. Create notifications (requires users)
  if (collections.includes('notifications')) {
    const notifications = [];
    if (!createdData.users || createdData.users.length === 0) {
      const msg = `No users found in Firestore. Notifications will not be created.`;
      console.warn(msg);
      summary.errors.push(msg);
    } else {
      console.log(`Creating ${counts.notifications} notifications...`);
      for (let i = 0; i < counts.notifications; i++) {
        try {
          const notificationData = generators.notifications(createdData.users, createdData.appointments);
          notifications.push(notificationData);
          await db.collection('notifications').doc(notificationData.id).set(notificationData);
        } catch (error) {
          console.error(`Error creating notification:`, error);
          summary.errors.push(`Notification: ${error.message}`);
        }
      }
      summary.notifications = notifications.length;
      createdData.notifications = notifications;
      console.log(`Created ${notifications.length} notifications`);
    }
  }

  // 7. Create verificationDocs
  if (collections.includes('verificationDocs')) {
    const docs = [];
    console.log(`Creating verificationDocs for ${createdData.doctors.length} doctors...`);
    for (const doctor of createdData.doctors) {
      const licenseDoc = {
        id: uuidv4(),
        doctorId: doctor.userId,
        type: 'License',
        url: faker.internet.url(),
        uploadedAt: admin.firestore.Timestamp.fromDate(faker.date.past())
      };
      const certDoc = {
        id: uuidv4(),
        doctorId: doctor.userId,
        type: 'Certificate',
        url: faker.internet.url(),
        uploadedAt: admin.firestore.Timestamp.fromDate(faker.date.past())
      };
      docs.push(licenseDoc, certDoc);
      await db.collection('verificationDocs').doc(licenseDoc.id).set(licenseDoc);
      await db.collection('verificationDocs').doc(certDoc.id).set(certDoc);
    }
    summary.verificationDocs = docs.length;
    createdData.verificationDocs = docs;
  }

  // 8. Create doctorVerifications for all doctors, but only if missing
  if (collections.includes('doctorVerifications')) {
    const verifications = [];
    console.log(`Ensuring doctorVerifications exist for all doctors...`);
    // Fetch all doctors from the 'doctors' collection
    const doctorsSnapshot = await db.collection('doctors').get();
    for (const doc of doctorsSnapshot.docs) {
      const id = doc.id;
      const docRef = db.collection('doctorVerifications').doc(id);
      const existing = await docRef.get();
      if (existing.exists) {
        continue; // Do not overwrite existing
      }
      const doctorData = doc.data();
      const verificationData = {
        doctorId: id,
        status: 'PENDING',
        notes: '',
        submissionData: {
          specialty: doctorData.specialty || 'General',
          licenseNumber: doctorData.licenseNumber || 'N/A',
          experience: doctorData.experience || 1,
          bio: doctorData.bio || '',
          location: doctorData.location || '',
          languages: doctorData.languages || ['English'],
          fee: doctorData.fee || 100
        },
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      };
      verifications.push(verificationData);
      await docRef.set(verificationData);
    }
    summary.doctorVerifications = verifications.length;
    createdData.doctorVerifications = verifications;
    console.log(`Created ${verifications.length} doctorVerifications (only for missing)`);
  }

  // Print summary
  console.log('\n=== Seeding Summary ===');
  console.log(`Users: ${summary.users}`);
  console.log(`Doctors: ${summary.doctors}`);
  console.log(`Patients: ${summary.patients}`);
  console.log(`Appointments: ${summary.appointments}`);
  console.log(`Notifications: ${summary.notifications}`);
  console.log(`Doctor Schedules: ${summary.doctorSchedules}`);
  console.log(`Verification Docs: ${summary.verificationDocs}`);
  console.log(`Doctor Verifications: ${summary.doctorVerifications}`);
  if (summary.errors.length > 0) {
    console.log('\nErrors/Warnings:');
    summary.errors.forEach(msg => console.log(`- ${msg}`));
  }
  console.log('Seeding completed successfully!');
}

/**
 * Generates default weekly availability slots (Mon-Fri, 9AM-5PM, 30-min increments).
 */
function generateDefaultAvailability() {
  const slots = [];
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    for (let hour = 9; hour < 17; hour++) {
      for (const minute of [0, 30]) {
        const startTime = `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
        const endHour = minute === 0 ? hour : hour + 1;
        const endMinute = minute === 0 ? '30' : '00';
        const endTime = `${endHour.toString().padStart(2,'0')}:${endMinute}`;
        slots.push({ id: uuidv4(), day, startTime, endTime });
      }
    }
  }
  return slots;
}

// --- Patch: Use Auth UID as Firestore user doc ID if available ---
const getAuthUsers = async () => {
  try {
    const list = await admin.auth().listUsers(1000);
    return list.users.map(u => ({
      uid: u.uid,
      email: u.email,
    }));
  } catch (e) {
    return [];
  }
};

// Unified main function for seeding
async function main() {
  // Get Auth users
  const authUsers = await getAuthUsers();
  const authUidSet = new Set(authUsers.map(u => u.uid));
  // Patch user generator to use Auth UID if email matches
  generators.users = () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    let userType = faker.helpers.arrayElement(['DOCTOR', 'PATIENT']);
    let roles = { [userType]: true };
    let uid = null;
    // Only one admin
    if (email === 'admin@example.com') {
      userType = 'ADMIN';
      roles = { admin: true };
    }
    // Try to find matching Auth user by email
    const matchingAuth = authUsers.find(u => u.email && u.email.toLowerCase() === email);
    if (matchingAuth) {
      uid = matchingAuth.uid;
    } else {
      uid = uuidv4();
    }
    // Ensure Zod compatibility: id, userType, isActive, emailVerified, phoneVerified, createdAt, updatedAt, firstName, lastName, phone
    return {
      id: uid,
      email,
      phone: faker.phone.number(),
      firstName,
      lastName,
      userType,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
      updatedAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  };
  // Call original seedData logic
  if (args.clear) {
    await clearCollections();
  }
  await seedData();
}

// Run the script
main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});