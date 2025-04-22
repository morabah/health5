#!/usr/bin/env ts-node

import admin from 'firebase-admin';
import { z } from 'zod';
import {
  UserProfileSchema,
  DoctorProfileSchema,
  PatientProfileSchema,
  DoctorAvailabilitySlotSchema,
  AppointmentSchema,
  NotificationSchema,
  VerificationDocumentSchema,
} from '../src/lib/zodSchemas';

async function validateCollection(name: string, schema: z.ZodTypeAny) {
  console.log(`\nValidating '${name}'...`);
  const snapshot = await admin.firestore().collection(name).get();
  const errors: string[] = [];
  snapshot.forEach(doc => {
    try {
      schema.parse(doc.data());
    } catch (e: any) {
      errors.push(`Doc ${doc.id}: ${JSON.stringify(e.errors)}`);
    }
  });
  if (errors.length) {
    console.error(`${name} - ${errors.length} validation errors:`);
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }
  console.log(`${name}: OK (${snapshot.size} docs)`);
  return true;
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  const schemaMap: Record<string, z.ZodTypeAny> = {
    users: UserProfileSchema,
    doctors: DoctorProfileSchema,
    patients: PatientProfileSchema,
    doctorSchedules: z.object({ doctorId: z.string(), slots: z.array(DoctorAvailabilitySlotSchema) }),
    appointments: AppointmentSchema,
    notifications: NotificationSchema,
    verificationDocs: VerificationDocumentSchema,
  };
  let ok = true;
  for (const [name, schema] of Object.entries(schemaMap)) {
    const valid = await validateCollection(name, schema);
    if (!valid) ok = false;
  }
  if (!ok) process.exit(1);
  console.log('\nAll collections validated successfully.');
}

main().catch(err => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
