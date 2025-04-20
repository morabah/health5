/**
 * Script to seed the live development Firestore with initial mock data.
 * Usage: npm run db:seed:dev
 * 
 */
// Type import for admin.auth types (for TS, does not affect runtime)
import type { auth as AdminAuth } from 'firebase-admin';
const admin: any = require('firebase-admin');
const path = require('path');
const serviceAccount: any = require(path.resolve(process.cwd(), 'scripts', 'serviceAccountKey.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});
// Initialize Firestore client
const db = admin.firestore();

const mockDataPath = path.resolve(process.cwd(), 'scripts', 'mockDataForScripts.js');
const {
  mockPatients,
  mockDoctors,
  mockAdmins,
  mockPatientProfiles,
  mockDoctorProfiles,
  mockDoctorAvailabilities,
  mockVerificationDocs,
  mockAppointmentsArray,
  mockNotificationsArray,
} = require(mockDataPath);

// Utility to delete all docs in a collection (for dev only)
async function deleteCollection(collectionName: string) {
  const collectionRef = db.collection(collectionName);
  let snapshot = await collectionRef.get();
  const batchSize = 500;
  let deleted = 0;
  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.slice(0, batchSize).forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.docs.length;
    if (snapshot.docs.length < batchSize) break;
    snapshot = await collectionRef.get();
  }
  console.log(`Deleted ${deleted} documents from ${collectionName}`);
}

// Utility to delete all Firebase Auth users (for dev only)
async function deleteAllAuthUsers(excludeEmails: string[] = []) {
  let nextPageToken: string | undefined = undefined;
  let totalDeleted = 0;
  do {
    const listUsersResult: AdminAuth.ListUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const usersToDelete = listUsersResult.users.filter(
      (user: AdminAuth.UserRecord) => !excludeEmails.includes(user.email || '')
    );
    const uids = usersToDelete.map((user: AdminAuth.UserRecord) => user.uid);
    if (uids.length > 0) {
      await admin.auth().deleteUsers(uids);
      totalDeleted += uids.length;
      console.log(`Deleted ${uids.length} auth users in batch`);
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  console.log(`All Auth users deleted (except exclusions). Total: ${totalDeleted}`);
}

async function createOrGetAuthUser(user: any) {
  // Try by email
  try {
    const existing = await admin.auth().getUserByEmail(user.email);
    return existing.uid;
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  // Try by phone number (if provided)
  if (user.phone) {
    try {
      const existing = await admin.auth().getUserByPhoneNumber(user.phone);
      return existing.uid;
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') throw err;
    }
  }
  // Create new user
  const created = await admin.auth().createUser({
    email: user.email,
    emailVerified: !!user.emailVerified,
    phoneNumber: user.phone || undefined,
    password: 'Password123!', // Default password for dev/demo
    displayName: user.firstName + ' ' + user.lastName,
    disabled: !user.isActive,
  });
  return created.uid;
}

async function main() {
  // === DANGER: DEV ONLY ===
  // 1. Delete all Auth users (except admin)
  await deleteAllAuthUsers([process.env.ADMIN_EMAIL || 'admin@example.com']);
  console.log('All Auth users deleted.');

  // 2. Delete all Firestore data
  await deleteCollection('users');
  await deleteCollection('patients');
  await deleteCollection('doctors');
  await deleteCollection('appointments');
  await deleteCollection('notifications');
  console.log('All collections cleared.');

  // 3. Create Auth users (patients, doctors, admins) and collect UIDs
  const allUsers = [
    ...mockPatients,
    ...mockDoctors,
    ...mockAdmins,
  ];
  const firestoreUsers: any[] = [];
  for (const user of allUsers) {
    const uid = await createOrGetAuthUser(user);
    firestoreUsers.push({ ...user, id: uid });
    await db.collection('users').doc(uid).set({ ...user, id: uid });
  }
  // Also seed admin user with the Auth UID for login (if not already handled)
  const adminAuthUid = process.env.ADMIN_AUTH_UID || 'WRkSVuEF3VcUiUJGVugSvz1WnG62';
  const mainAdmin = firestoreUsers.find((u: any) => u.email === 'admin@example.com');
  if (mainAdmin && mainAdmin.id !== adminAuthUid) {
    await db.collection('users').doc(adminAuthUid).set({ ...mainAdmin, id: adminAuthUid });
  }
  console.log('Seeded users (Auth + Firestore)');

  // 4. Create other database records (patients, doctors, availabilities, etc.)
  for (const p of mockPatientProfiles) {
    const user = firestoreUsers.find((u: any) => u.email === p.userId || u.email === p.email || u.id === p.userId);
    if (user) {
      await db.collection('patients').doc(user.id).set({ ...p, userId: user.id });
    }
  }
  console.log('Seeded patient profiles');

  for (const d of mockDoctorProfiles) {
    const user = firestoreUsers.find((u: any) => u.email === d.userId || u.email === d.email || u.id === d.userId);
    if (user) {
      await db.collection('doctors').doc(user.id).set({ ...d, userId: user.id });
    }
  }
  console.log('Seeded doctor profiles');

  for (let i = 0; i < mockDoctors.length; i++) {
    const user = firestoreUsers.find((u: any) => u.email === mockDoctors[i].email);
    if (!user) continue;
    const doctorId = user.id;
    for (const slot of mockDoctorAvailabilities[i]) {
      await db.collection('doctors').doc(doctorId).collection('availability').doc(slot.id).set(slot);
    }
  }
  console.log('Seeded doctor availabilities');

  for (let i = 0; i < mockDoctors.length; i++) {
    const user = firestoreUsers.find((u: any) => u.email === mockDoctors[i].email);
    if (!user) continue;
    const doctorId = user.id;
    for (const doc of mockVerificationDocs[i]) {
      await db.collection('doctors').doc(doctorId).collection('verificationDocs').doc(doc.id).set(doc);
    }
  }
  console.log('Seeded doctor verification docs');

  for (const appt of mockAppointmentsArray) {
    const patient = firestoreUsers.find((u: any) => u.email === appt.patientEmail);
    const doctor = firestoreUsers.find((u: any) => u.email === appt.doctorEmail);
    await db.collection('appointments').doc(appt.id).set({
      ...appt,
      patientId: patient ? patient.id : appt.patientId,
      doctorId: doctor ? doctor.id : appt.doctorId,
    });
  }
  console.log('Seeded appointments');

  for (const notif of mockNotificationsArray) {
    const user = firestoreUsers.find((u: any) => u.email === notif.userEmail);
    await db.collection('notifications').doc(notif.id).set({
      ...notif,
      userId: user ? user.id : notif.userId,
    });
  }
  console.log('Seeded notifications');

  console.log('Firestore and Auth seeding complete!');
}

main().catch(err => {
  console.error('Error seeding Firestore:', err);
  process.exit(1);
});
