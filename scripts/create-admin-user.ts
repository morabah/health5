/**
 * Script to create an admin user for the Health Appointment System.
 * Usage: npx ts-node scripts/create-admin-user.ts --email=admin@example.com --password=AdminPass123! --firstName=Super --lastName=Admin --phone=+1234567890
 */
import * as admin from 'firebase-admin';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.resolve(process.cwd(), 'scripts', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

const argv = yargs(hideBin(process.argv))
  .option('email', { type: 'string', demandOption: true })
  .option('password', { type: 'string', demandOption: true })
  .option('firstName', { type: 'string', demandOption: true })
  .option('lastName', { type: 'string', demandOption: true })
  .option('phone', { type: 'string', demandOption: false })
  .argv as any;

async function createAdminUser() {
  try {
    // Check if user exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(argv.email);
      console.log(`User already exists: ${userRecord.uid}`);
      // Only include phoneNumber if valid E.164
      const updateParams: admin.auth.UpdateRequest = {
        password: argv.password,
        displayName: `${argv.firstName} ${argv.lastName}`,
        emailVerified: true,
        disabled: false
      };
      if (argv.phone && /^\+[1-9]\d{9,14}$/.test(argv.phone)) {
        updateParams.phoneNumber = argv.phone;
      }
      await admin.auth().updateUser(userRecord.uid, updateParams);
      console.log('Admin password and settings updated.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: argv.email,
          password: argv.password,
          displayName: `${argv.firstName} ${argv.lastName}`,
          phoneNumber: argv.phone || undefined,
          emailVerified: true,
          disabled: false,
        });
        console.log(`Created new user: ${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    // Create Firestore user profile
    const userProfile = {
      id: userRecord.uid,
      email: argv.email,
      phone: argv.phone || null,
      firstName: argv.firstName,
      lastName: argv.lastName,
      userType: 'ADMIN',
      isActive: true,
      emailVerified: true,
      phoneVerified: !!argv.phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('users').doc(userRecord.uid).set(userProfile, { merge: true });
    console.log('Admin user profile created/updated in Firestore.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
