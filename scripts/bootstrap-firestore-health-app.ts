import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

// --- CONFIGURE THESE USERS/DOCTORS/PATIENTS ---
const doctors = [
  {
    email: 'doctor1@example.com',
    password: 'password123',
    firstName: 'Doctor1',
    lastName: 'Test',
    specialty: 'General Practice',
    location: 'New York',
    languages: ['English'],
    consultationFee: 100,
    bio: 'Experienced general practitioner.',
  },
  {
    email: 'doctor2@example.com',
    password: 'password123',
    firstName: 'Doctor2',
    lastName: 'Smith',
    specialty: 'Cardiology',
    location: 'Boston',
    languages: ['English', 'Spanish'],
    consultationFee: 200,
    bio: 'Specialist in heart health.',
  },
];
const patients = [
  {
    email: 'patient1@example.com',
    password: 'password123',
    firstName: 'Patient1',
    lastName: 'One',
  },
  {
    email: 'patient2@example.com',
    password: 'password123',
    firstName: 'Patient2',
    lastName: 'Two',
  },
];

async function createOrUpdateUser(user: any, role: 'doctor' | 'patient') {
  let userRecord;
  try {
    userRecord = await getAuth().getUserByEmail(user.email);
    console.log(`User exists: ${user.email}`);
  } catch {
    userRecord = await getAuth().createUser({
      email: user.email,
      password: user.password,
      displayName: `${user.firstName} ${user.lastName}`,
    });
    console.log(`Created user: ${user.email}`);
  }
  // Create user profile
  await db.collection('users').doc(userRecord.uid).set({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  if (role === 'doctor') {
    // Create doctor profile
    await db.collection('doctors').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      specialty: user.specialty,
      location: user.location,
      languages: user.languages,
      consultationFee: user.consultationFee,
      bio: user.bio,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  if (role === 'patient') {
    // Create patient profile
    await db.collection('patients').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

async function main() {
  for (const doc of doctors) {
    await createOrUpdateUser(doc, 'doctor');
  }
  for (const pat of patients) {
    await createOrUpdateUser(pat, 'patient');
  }
  console.log('Firestore bootstrap complete!');
}

// --- NEW: Assign role and create profile for every Auth user ---
async function createProfileForAllAuthUsers() {
  const auth = getAuth();
  const allUsers: any[] = [];
  let nextPageToken: string | undefined = undefined;
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    allUsers.push(...list.users);
    nextPageToken = list.pageToken;
  } while (nextPageToken);

  for (const user of allUsers) {
    // Decide role: if email starts with 'doctor', assign doctor; if 'patient', assign patient
    let role: 'doctor' | 'patient' | undefined = undefined;
    if (user.email?.startsWith('doctor')) role = 'doctor';
    if (user.email?.startsWith('patient')) role = 'patient';
    if (!role) continue; // Skip users who don't match

    // Check if profile already exists
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) continue;

    // Populate profile data from email or fallback
    let profile: any = {
      email: user.email,
      firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0],
      lastName: user.displayName?.split(' ')[1] || '',
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (role === 'doctor') {
      profile = {
        ...profile,
        specialty: 'General Practice',
        location: 'Unknown',
        languages: ['English'],
        consultationFee: 100,
        bio: 'Auto-generated doctor profile.',
        verified: false,
      };
      await db.collection('doctors').doc(user.uid).set(profile, { merge: true });
    } else if (role === 'patient') {
      await db.collection('patients').doc(user.uid).set(profile, { merge: true });
    }
    await db.collection('users').doc(user.uid).set(profile, { merge: true });
    console.log(`Created ${role} profile for ${user.email}`);
  }
}

// --- Add mock appointments, availability, and booking data ---
import { mockAppointmentsArray, mockDoctorProfilesArray } from '../src/types/mockData';

async function createAvailabilityForDoctor(doctorId: string) {
  // Example: add a week's worth of morning slots
  const availabilityRef = db.collection('doctors').doc(doctorId).collection('availability');
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    await availabilityRef.doc(date.toISOString().slice(0, 10)).set({
      date: date,
      slots: [
        { start: '09:00', end: '09:30' },
        { start: '10:00', end: '10:30' },
        { start: '11:00', end: '11:30' },
      ],
    });
  }
}

async function createAppointmentsAndAvailability() {
  // Appointments
  for (const appt of mockAppointmentsArray) {
    await db.collection('appointments').doc(appt.id!).set({ ...appt, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  // Availability for each doctor
  for (const doctor of mockDoctorProfilesArray) {
    await createAvailabilityForDoctor(doctor.userId);
  }
}

// --- FETCH AUTH USERS FROM FIREBASE AND GENERATE MOCKDATA ---
import { UserType } from '../src/types/enums';
import type { UserProfile } from '../src/types/user';

async function generateMockUserProfilesFromAuth(): Promise<UserProfile[]> {
  const auth = admin.auth();
  let nextPageToken: string | undefined = undefined;
  const allUsers: UserProfile[] = [];
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const user of result.users) {
      // Determine userType by email prefix or custom claims if available
      let userType: UserType = UserType.PATIENT;
      if (user.email?.startsWith('doctor')) userType = UserType.DOCTOR;
      if (user.email?.startsWith('admin')) userType = UserType.ADMIN;
      allUsers.push({
        id: user.uid,
        email: user.email ?? null,
        phone: user.phoneNumber ?? null,
        firstName: user.displayName?.split(' ')[0] ?? '',
        lastName: user.displayName?.split(' ')[1] ?? '',
        userType,
        isActive: !user.disabled,
        emailVerified: user.emailVerified,
        phoneVerified: !!user.phoneNumber,
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        updatedAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
      });
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return allUsers;
}

// Example usage: generate and log
if (require.main === module) {
  generateMockUserProfilesFromAuth().then(users => {
    console.log('Generated User Profiles from Firebase Auth:', users);
  });
}

// --- Call after user/profile creation ---
main()
  .then(() => createProfileForAllAuthUsers())
  .then(() => createAppointmentsAndAvailability())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
