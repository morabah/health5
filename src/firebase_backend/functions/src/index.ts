import * as functions from 'firebase-functions';
import { z } from 'zod';
import { auth, db } from './config/firebaseAdmin';
import { logInfo, logError } from './shared/logger';
import { trackPerformance } from './shared/performance';
import { createUserProfileInFirestore } from './user';
import { createPatientProfileInFirestore } from './patient';
import { createDoctorProfileInFirestore } from './doctor';

// Base schema for both patient and doctor registration
const BaseRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  userType: z.enum(['PATIENT', 'DOCTOR']),
});

// Patient-specific schema
const PatientRegisterSchema = BaseRegisterSchema.extend({
  userType: z.literal('PATIENT'),
});

// Doctor-specific schema
const DoctorRegisterSchema = BaseRegisterSchema.extend({
  userType: z.literal('DOCTOR'),
  specialty: z.string().min(1),
  licenseNumber: z.string().min(1),
});

// Discriminated union
const RegisterSchema = z.discriminatedUnion('userType', [PatientRegisterSchema, DoctorRegisterSchema]);

/**
 * HTTPS Callable function to register a new user (Patient or Doctor).
 * Performs Zod validation, checks for existing user, creates Auth user and Firestore profiles.
 * PHI-aware logging: only logs identifiers and non-sensitive fields.
 */
export const registerUser = functions.https.onCall(async (data, context) => {
  const start = Date.now();
  logInfo('[registerUser] Called', { callerUid: context.auth?.uid });

  // Validate input
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    logError('[registerUser] Validation failed', { issues: parsed.error.format() });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid registration data');
  }
  const { email, password, firstName, lastName, phone, userType, specialty, licenseNumber } = parsed.data;

  // Check if user already exists
  try {
    await auth.getUserByEmail(email);
    throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // proceed
    } else if (err instanceof functions.https.HttpsError) {
      throw err;
    } else {
      logError('[registerUser] Error checking existing user', { code: err.code });
      throw new functions.https.HttpsError('internal', 'Error checking existing user');
    }
  }

  // Create Firebase Auth user
  let uid: string;
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phone,
    });
    uid = userRecord.uid;
    logInfo('[registerUser] Auth user created', { uid, userType });
  } catch (err: any) {
    logError('[registerUser] Auth creation error', { code: err.code });
    throw new functions.https.HttpsError('internal', 'Failed to create auth user');
  }

  // Create Firestore profiles
  try {
    await createUserProfileInFirestore(uid, { email, firstName, lastName, phone, userType });
    if (userType === 'PATIENT') {
      await createPatientProfileInFirestore(uid, {});
    } else {
      await createDoctorProfileInFirestore(uid, { specialty: specialty!, licenseNumber: licenseNumber! });
    }
  } catch (err: any) {
    logError('[registerUser] Firestore profile error', { error: err });
    throw new functions.https.HttpsError('internal', 'Failed to create user profiles');
  }

  const duration = Date.now() - start;
  logInfo('[registerUser] Completed', { uid, duration });
  return { success: true, userId: uid };
});
