/**
 * Firestore Notification Seeding Script
 * 
 * This script populates the Firestore 'notifications' collection with sample notification data
 * for development and testing purposes.
 * 
 * Usage:
 *   node scripts/seed-notifications.js [options]
 * 
 * Options:
 *   --count=N        Number of notifications to create (default: 50)
 *   --clear          Clear existing notifications before adding new ones
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
}, { count: 50, clear: false, help: false });

// Display help and exit
if (args.help) {
  console.log(`
Firestore Notification Seeding Script

This script populates the Firestore 'notifications' collection with sample notification data
for development and testing purposes.

Usage:
  node scripts/seed-notifications.js [options]

Options:
  --count=N        Number of notifications to create (default: 50)
  --clear          Clear existing notifications before adding new ones
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

// Sample data for notifications
const notificationTypes = [
  'appointment_created',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_rescheduled',
  'appointment_reminder',
  'doctor_verification_status_changed',
  'message_received',
  'report_available'
];

// Generate notification title based on type
function getNotificationTitle(type) {
  switch (type) {
    case 'appointment_created':
      return 'New Appointment Created';
    case 'appointment_confirmed':
      return 'Appointment Confirmed';
    case 'appointment_cancelled':
      return 'Appointment Cancelled';
    case 'appointment_rescheduled':
      return 'Appointment Rescheduled';
    case 'appointment_reminder':
      return 'Upcoming Appointment Reminder';
    case 'doctor_verification_status_changed':
      return 'Verification Status Updated';
    case 'message_received':
      return 'New Message Received';
    case 'report_available':
      return 'Medical Report Available';
    default:
      return 'Notification';
  }
}

// Generate notification message based on type
function getNotificationMessage(type, doctorName, appointmentTime) {
  switch (type) {
    case 'appointment_created':
      return `Your appointment with ${doctorName} has been created for ${appointmentTime}.`;
    case 'appointment_confirmed':
      return `Your appointment with ${doctorName} on ${appointmentTime} has been confirmed.`;
    case 'appointment_cancelled':
      return `Your appointment with ${doctorName} on ${appointmentTime} has been cancelled.`;
    case 'appointment_rescheduled':
      return `Your appointment with ${doctorName} has been rescheduled to ${appointmentTime}.`;
    case 'appointment_reminder':
      return `Reminder: You have an appointment with ${doctorName} tomorrow at ${appointmentTime}.`;
    case 'doctor_verification_status_changed':
      return 'Your verification status has been updated. Please check your profile.';
    case 'message_received':
      return `You have received a new message from ${doctorName}.`;
    case 'report_available':
      return 'Your medical report is now available. Please check your documents.';
    default:
      return 'You have a new notification.';
  }
}

// Function to generate a random date in the past (up to 30 days ago)
function generateRecentDate() {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Random date within past 30 days
  pastDate.setHours(Math.floor(Math.random() * 24));
  pastDate.setMinutes(Math.floor(Math.random() * 60));
  return pastDate;
}

// Load user data from seeded Firebase Auth users if available
function getAuthUsers() {
  const usersDataPath = path.resolve('./scripts/userData.json');
  
  if (fs.existsSync(usersDataPath)) {
    try {
      const userData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
      return {
        patients: userData.patients || [],
        doctors: userData.doctors || [],
        admins: userData.admins || []
      };
    } catch (error) {
      console.warn('Warning: Failed to parse user data file:', error.message);
      return { patients: [], doctors: [], admins: [] };
    }
  }
  
  return { patients: [], doctors: [], admins: [] };
}

// Generate random notification data
async function generateNotificationData(index) {
  try {
    // Load any preexisting auth users first
    const authUsers = getAuthUsers();
    const allAuthUsers = [...authUsers.patients, ...authUsers.doctors, ...authUsers.admins];
    
    // Decide which type of user will receive this notification
    const userTypes = ['patients', 'doctors', 'users'];
    const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
    
    const userSnapshot = await db.collection(userType).limit(20).get();
    
    if (userSnapshot.empty) {
      throw new Error(`No documents found in ${userType} collection. Please seed users first.`);
    }
    
    const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const user = users[Math.floor(Math.random() * users.length)];
    
    // Get random doctor (for reference in notification messages)
    const doctorSnapshot = await db.collection('doctors').limit(15).get();
    const doctors = !doctorSnapshot.empty ? 
      doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : 
      [{ firstName: 'John', lastName: 'Doe' }];
    
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const doctorName = `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    
    // Get random appointment (for reference in notification messages)
    const appointmentSnapshot = await db.collection('appointments').limit(15).get();
    let relatedAppointmentId = null;
    let appointmentTime = '9:00 AM';
    
    if (!appointmentSnapshot.empty) {
      const appointments = appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const appointment = appointments[Math.floor(Math.random() * appointments.length)];
      relatedAppointmentId = appointment.id;
      
      // Format the appointment time
      if (appointment.appointmentDate) {
        const date = appointment.appointmentDate.toDate ? 
          appointment.appointmentDate.toDate() : 
          new Date(appointment.appointmentDate);
        
        appointmentTime = `${date.toLocaleDateString()} at ${appointment.startTime || '9:00'}`;
      }
      
      // If we have a valid appointment, prioritize the actual participants
      if (userType === 'patients' && appointment.patientId) {
        // Try to find the specific patient for this appointment
        const specificPatient = users.find(u => u.id === appointment.patientId);
        if (specificPatient) {
          user = specificPatient;
        }
      } else if (userType === 'doctors' && appointment.doctorId) {
        // Try to find the specific doctor for this appointment
        const specificDoctor = doctors.find(d => d.id === appointment.doctorId);
        if (specificDoctor) {
          doctor = specificDoctor;
        }
      }
    }
    
    // Determine appropriate notification type based on user type
    let type;
    if (userType === 'doctors') {
      // Notifications relevant to doctors
      type = ['appointment_created', 'appointment_cancelled', 'appointment_rescheduled', 
              'doctor_verification_status_changed'][Math.floor(Math.random() * 4)];
    } else if (userType === 'patients') {
      // Notifications relevant to patients
      type = ['appointment_confirmed', 'appointment_reminder', 'appointment_cancelled',
              'report_available', 'message_received'][Math.floor(Math.random() * 5)];
    } else {
      // General notifications for any user type
      type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    }
    
    const title = getNotificationTitle(type);
    const message = getNotificationMessage(type, doctorName, appointmentTime);
    const createdAt = generateRecentDate();
    const isRead = Math.random() > 0.7; // 30% chance of being read
    
    return {
      userId: user.id,
      type,
      title,
      message,
      isRead,
      createdAt: admin.firestore.Timestamp.fromDate(createdAt),
      relatedId: type.includes('appointment') ? relatedAppointmentId : null
    };
  } catch (error) {
    console.error('Error generating notification data:', error);
    // Return a default notification if there's an error
    return {
      userId: `user_${Math.floor(Math.random() * 100)}`,
      type: 'system',
      title: 'System Notification',
      message: 'This is a system notification.',
      isRead: false,
      createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };
  }
}

// Main function to seed notifications
async function seedNotifications() {
  try {
    const notificationsCollection = db.collection('notifications');
    
    // Clear existing notifications if requested
    if (args.clear) {
      console.log('Clearing existing notifications...');
      const snapshot = await notificationsCollection.get();
      
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
      console.log(`Cleared ${snapshot.size} existing notifications`);
    }
    
    // Add new notifications
    console.log(`Creating ${args.count} notifications...`);
    
    // For notifications, we'll do them one by one since each requires fetching random users and possibly appointments
    for (let i = 0; i < args.count; i++) {
      try {
        const notificationData = await generateNotificationData(i);
        await notificationsCollection.doc().set(notificationData);
        
        if ((i + 1) % 10 === 0 || i === args.count - 1) {
          console.log(`Progress: ${i + 1}/${args.count} notifications created`);
        }
      } catch (error) {
        console.error(`Error creating notification ${i + 1}:`, error.message);
      }
    }
    
    console.log(`Successfully added ${args.count} notifications to Firestore`);
  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the seeding function
seedNotifications(); 