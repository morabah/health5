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
let collections = (args.collections || 'users,doctors,patients,appointments,notifications').split(',');

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
  notifications: 20
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
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const roles = faker.helpers.arrayElement([
      ['admin'],
      ['staff'],
      ['doctor'],
      ['patient'],
      ['doctor', 'staff'],
      ['patient', 'staff']
    ]);
    
    return {
      uid: uuidv4(),
      email,
      displayName: `${firstName} ${lastName}`,
      photoURL: faker.image.avatarGitHub(),
      phoneNumber: faker.phone.number(),
      roles: roles.reduce((obj, role) => ({ ...obj, [role]: true }), {}),
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
      lastLoginAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate a doctor document
  doctors: (users) => {
    // If users are provided, try to find a user with doctor role
    let userId = uuidv4();
    if (users && users.length > 0) {
      const doctorUsers = users.filter(user => user.roles.doctor);
      if (doctorUsers.length > 0) {
        userId = faker.helpers.arrayElement(doctorUsers).uid;
      }
    }
    
    const specialties = [
      'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
      'Neurology', 'Obstetrics', 'Oncology', 'Ophthalmology', 'Pediatrics',
      'Psychiatry', 'Radiology', 'Surgery', 'Urology', 'Family Medicine'
    ];
    
    const availability = [];
    // Generate availability for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const slots = [];
      // Create 30-minute slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          // 50% chance of being available
          if (Math.random() > 0.5) {
            slots.push({
              startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              endTime: minute === 0 ? 
                `${hour.toString().padStart(2, '0')}:30` : 
                `${(hour + 1).toString().padStart(2, '0')}:00`,
              status: 'available'
            });
          }
        }
      }
      
      if (slots.length > 0) {
        availability.push({
          date: admin.firestore.Timestamp.fromDate(date),
          slots
        });
      }
    }
    
    return {
      id: uuidv4(),
      userId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      specialty: faker.helpers.arrayElement(specialties),
      education: [
        {
          degree: faker.helpers.arrayElement(['MD', 'PhD', 'DO', 'MBBS']),
          institution: faker.company.name() + ' Medical School',
          year: faker.date.past({ years: 20 }).getFullYear()
        }
      ],
      experience: faker.number.int({ min: 1, max: 30 }),
      bio: faker.lorem.paragraph(3),
      availability,
      rating: faker.number.float({ min: 3.5, max: 5, precision: 0.1 }),
      reviewCount: faker.number.int({ min: 5, max: 500 }),
      appointments: [],
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past())
    };
  },
  
  // Generate a patient document
  patients: (users) => {
    // If users are provided, try to find a user with patient role
    let userId = uuidv4();
    if (users && users.length > 0) {
      const patientUsers = users.filter(user => user.roles.patient);
      if (patientUsers.length > 0) {
        userId = faker.helpers.arrayElement(patientUsers).uid;
      }
    }
    
    const dob = faker.date.birthdate();
    
    return {
      id: uuidv4(),
      userId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: admin.firestore.Timestamp.fromDate(dob),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode()
      },
      phoneNumber: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Child', 'Sibling', 'Friend']),
        phoneNumber: faker.phone.number()
      },
      medicalHistory: {
        allergies: Math.random() > 0.7 ? [faker.helpers.arrayElement(['Penicillin', 'Peanuts', 'Latex', 'Pollen', 'Dairy'])] : [],
        conditions: Math.random() > 0.6 ? [faker.helpers.arrayElement(['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'None'])] : [],
        medications: Math.random() > 0.5 ? [faker.helpers.arrayElement(['Aspirin', 'Insulin', 'Lipitor', 'Ventolin', 'None'])] : [],
        surgeries: Math.random() > 0.8 ? [faker.helpers.arrayElement(['Appendectomy', 'Tonsillectomy', 'LASIK', 'None'])] : []
      },
      appointments: [],
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past())
    };
  },
  
  // Generate an appointment document
  appointments: (doctors, patients) => {
    if (!doctors || !doctors.length || !patients || !patients.length) {
      throw new Error('Cannot create appointments without doctors and patients');
    }
    
    const doctor = faker.helpers.arrayElement(doctors);
    const patient = faker.helpers.arrayElement(patients);
    
    // Find an available slot from the doctor's availability
    let appointmentDate = null;
    let appointmentSlot = null;
    
    if (doctor.availability && doctor.availability.length > 0) {
      const dayInfo = faker.helpers.arrayElement(doctor.availability);
      if (dayInfo.slots && dayInfo.slots.length > 0) {
        appointmentDate = dayInfo.date;
        appointmentSlot = faker.helpers.arrayElement(dayInfo.slots);
      }
    }
    
    // If no availability, generate random date/time
    if (!appointmentDate || !appointmentSlot) {
      const date = faker.date.soon({ days: 30 });
      // Round to nearest 30 minutes
      date.setMinutes(Math.round(date.getMinutes() / 30) * 30);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      appointmentDate = admin.firestore.Timestamp.fromDate(date);
      
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      appointmentSlot = {
        startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        endTime: minute === 0 ? 
          `${hour.toString().padStart(2, '0')}:30` : 
          `${(hour + 1).toString().padStart(2, '0')}:00`,
        status: 'booked'
      };
    }
    
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    const weightedStatuses = [
      ...Array(15).fill('scheduled'),
      ...Array(5).fill('completed'),
      ...Array(2).fill('cancelled'),
      ...Array(1).fill('no-show')
    ];
    
    const reason = faker.helpers.arrayElement([
      'Annual physical examination',
      'Follow-up consultation',
      'Vaccination',
      'Prescription renewal',
      'Headache and dizziness',
      'Skin rash and itching',
      'Joint pain',
      'Respiratory infection',
      'Digestive issues',
      'Mental health consultation'
    ]);
    
    const appointmentId = uuidv4();
    
    return {
      id: appointmentId,
      doctorId: doctor.id,
      patientId: patient.id,
      date: appointmentDate,
      slot: {
        startTime: appointmentSlot.startTime,
        endTime: appointmentSlot.endTime
      },
      reason,
      notes: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(weightedStatuses),
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent())
    };
  },
  
  // Generate a notification document
  notifications: (users, appointments) => {
    if (!users || !users.length) {
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
          content = `Reminder: You have an appointment scheduled for ${appointment.date.toDate().toLocaleString()}`;
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
    
    return {
      id: uuidv4(),
      userId: user.uid,
      type,
      content,
      relatedId,
      read: faker.datatype.boolean(0.3), // 30% chance of being read
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent()),
      expiresAt: admin.firestore.Timestamp.fromDate(faker.date.soon({ days: 30 }))
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
  
  // 1. Create users first
  if (collections.includes('users')) {
    const users = [];
    console.log(`Creating ${counts.users} users...`);
    
    for (let i = 0; i < counts.users; i++) {
      const userData = generators.users();
      users.push(userData);
      
      try {
        await db.collection('users').doc(userData.uid).set(userData);
      } catch (error) {
        console.error(`Error creating user document:`, error);
      }
    }
    
    createdData.users = users;
    console.log(`Created ${users.length} users`);
  }
  
  // 2. Create doctors
  if (collections.includes('doctors')) {
    const doctors = [];
    console.log(`Creating ${counts.doctors} doctors...`);
    
    for (let i = 0; i < counts.doctors; i++) {
      const doctorData = generators.doctors(createdData.users);
      doctors.push(doctorData);
      
      try {
        await db.collection('doctors').doc(doctorData.id).set(doctorData);
      } catch (error) {
        console.error(`Error creating doctor document:`, error);
      }
    }
    
    createdData.doctors = doctors;
    console.log(`Created ${doctors.length} doctors`);
  }
  
  // 3. Create patients
  if (collections.includes('patients')) {
    const patients = [];
    console.log(`Creating ${counts.patients} patients...`);
    
    for (let i = 0; i < counts.patients; i++) {
      const patientData = generators.patients(createdData.users);
      patients.push(patientData);
      
      try {
        await db.collection('patients').doc(patientData.id).set(patientData);
      } catch (error) {
        console.error(`Error creating patient document:`, error);
      }
    }
    
    createdData.patients = patients;
    console.log(`Created ${patients.length} patients`);
  }
  
  // 4. Create appointments (requires doctors and patients)
  if (collections.includes('appointments') && createdData.doctors && createdData.patients) {
    const appointments = [];
    console.log(`Creating ${counts.appointments} appointments...`);
    
    for (let i = 0; i < counts.appointments; i++) {
      try {
        const appointmentData = generators.appointments(createdData.doctors, createdData.patients);
        appointments.push(appointmentData);
        
        await db.collection('appointments').doc(appointmentData.id).set(appointmentData);
        
        // Update doctor and patient with appointment reference
        const doctorRef = db.collection('doctors').doc(appointmentData.doctorId);
        const patientRef = db.collection('patients').doc(appointmentData.patientId);
        
        await doctorRef.update({
          appointments: admin.firestore.FieldValue.arrayUnion(appointmentData.id)
        });
        
        await patientRef.update({
          appointments: admin.firestore.FieldValue.arrayUnion(appointmentData.id)
        });
      } catch (error) {
        console.error(`Error creating appointment:`, error);
      }
    }
    
    createdData.appointments = appointments;
    console.log(`Created ${appointments.length} appointments`);
  }
  
  // 5. Create notifications (requires users)
  if (collections.includes('notifications') && createdData.users) {
    const notifications = [];
    console.log(`Creating ${counts.notifications} notifications...`);
    
    for (let i = 0; i < counts.notifications; i++) {
      try {
        const notificationData = generators.notifications(createdData.users, createdData.appointments);
        notifications.push(notificationData);
        
        await db.collection('notifications').doc(notificationData.id).set(notificationData);
      } catch (error) {
        console.error(`Error creating notification:`, error);
      }
    }
    
    createdData.notifications = notifications;
    console.log(`Created ${notifications.length} notifications`);
  }
  
  console.log('Seeding completed successfully!');
}

// Main function
async function main() {
  console.log('Starting Firebase Firestore seeding...');
  
  try {
    // Clear collections if requested
    if (args.clear) {
      await clearCollections();
    }
    
    // Seed data
    await seedData();
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

// Run the script
main(); 