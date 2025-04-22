// Script: validate-firestore-users-with-zod.ts
// Description: Fetches all user documents from Firestore and validates them against the Zod UserProfileSchema, DoctorProfileSchema, and PatientProfileSchema.
// Reports any invalid documents and prints a summary.

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { UserProfileSchema, DoctorProfileSchema, PatientProfileSchema } from '../src/lib/zodSchemas';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

const normalizeRole = (user: any) => {
  if (user.userType === 'DOCTOR') return 'doctor';
  if (user.userType === 'PATIENT') return 'patient';
  return 'other';
};

async function main() {
  const snapshot = await db.collection('users').get();
  let valid = 0;
  let invalid = 0;
  let errors: any[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let schema;
    const role = normalizeRole(data);
    if (role === 'doctor') {
      schema = DoctorProfileSchema;
    } else if (role === 'patient') {
      schema = PatientProfileSchema;
    } else {
      schema = UserProfileSchema;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
      invalid++;
      errors.push({ id: doc.id, email: data.email, errors: result.error.errors });
    } else {
      valid++;
    }
  }

  console.log(`\nValidation complete. Valid: ${valid}, Invalid: ${invalid}`);
  if (errors.length > 0) {
    console.log('\nInvalid documents:');
    for (const err of errors) {
      console.log(`- ID: ${err.id} | Email: ${err.email}`);
      console.dir(err.errors, { depth: null });
    }
  } else {
    console.log('All user documents are valid according to Zod schemas.');
  }
}

main().catch(err => {
  console.error('Validation script error:', err);
  process.exit(1);
});
