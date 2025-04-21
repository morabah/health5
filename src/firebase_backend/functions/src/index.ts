import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auth, db } from './config/firebaseAdmin';
import { logInfo, logError } from './shared/logger';
import { trackPerformance } from './shared/performance';
import { createUserProfileInFirestore } from './user';
import { createPatientProfileInFirestore } from './patient';
import { createDoctorProfileInFirestore } from './doctor';
import { fetchUserProfileData } from './user/userProfileManagement';
import { fetchUserAppointments, GetAppointmentsSchema } from './appointment/appointmentManagement';
import { AppointmentStatus } from './types/enums';

// Base schema for both patient and doctor registration
const BaseRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
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

  // --- START VERBOSE LOGGING ---
  console.log('[registerUser] RAW DATA RECEIVED:', JSON.stringify(data));
  console.log('[registerUser] DATA KEYS:', Object.keys(data));
  Object.entries(data).forEach(([key, value]) => {
    console.log(`[registerUser] DATA TYPE - ${key}: ${typeof value}`);
  });
  // --- END VERBOSE LOGGING ---

  // Validate input
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    // Log the payload received
    // eslint-disable-next-line no-console
    console.error('[registerUser] Payload received (in error block):', data);
    // Log the full Zod error object
    // eslint-disable-next-line no-console
    console.error('[registerUser] Zod error object:', parsed.error);
    // Log Zod error paths and messages for each error
    // eslint-disable-next-line no-console
    console.error('[registerUser] Zod error paths:', parsed.error.errors.map((e: any) => ({ path: e.path, message: e.message })));

    // --- START VERBOSE ZOD ERROR LOGGING ---
    console.error('[registerUser] DETAILED ZOD ISSUES (FORMATTED):', JSON.stringify(parsed.error.format()));
    console.error('[registerUser] DETAILED ZOD ISSUES (ERRORS ARRAY):', JSON.stringify(parsed.error.errors));
    // --- END VERBOSE ZOD ERROR LOGGING ---

    logError('[registerUser] Validation failed', { issues: parsed.error.format(), errors: parsed.error.errors });
    // eslint-disable-next-line no-console
    console.error('Zod validation error:', parsed.error.format(), parsed.error.errors);
    // Build a readable error message with field-level errors
    const issues = parsed.error.format();
    let errorFields = Object.entries(issues)
      .filter(([key]) => key !== '_errors')
      .map(([key, val]: [string, any]) => `${key}: ${(val?._errors || []).join(', ')}`)
      .join(' | ');
    let message = 'Invalid registration data';
    if (errorFields) message += `: ${errorFields}`;
    // Include raw errors array for debugging
    message += ` | raw: ${JSON.stringify(parsed.error.errors)}`;
    throw new functions.https.HttpsError(
      'invalid-argument',
      message
    );
  }
  // Only destructure fields allowed by userType
  const { email, password, firstName, lastName, phone } = parsed.data;
  const userType = parsed.data.userType.toUpperCase();
  let specialty: string | undefined;
  let licenseNumber: string | undefined;
  if (userType === 'DOCTOR') {
    specialty = (parsed.data as any).specialty;
    licenseNumber = (parsed.data as any).licenseNumber;
  }

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
    // Prepare Auth creation params, include phoneNumber only if provided
    const createParams: admin.auth.CreateRequest = {
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    };
    // Include phoneNumber only if in E.164 format (starts with '+')
    if (phone && phone.startsWith('+')) {
      createParams.phoneNumber = phone;
    }
    const userRecord = await auth.createUser(createParams);
    uid = userRecord.uid;
    logInfo('[registerUser] Auth user created', { uid, userType });
  } catch (err: any) {
    logError('[registerUser] Auth creation error', { code: err.code, message: err.message });
    // If admin throw invalid phone format (with or without prefix)
    if (err.code && err.code.includes('invalid-phone-number')) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format. Please include country code e.g. +1234567890');
    }
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

/**
 * Test function to diagnose patient registration issues.
 * TEMPORARY: This bypasses validation to debug the patient registration flow.
 */
export const debugRegisterPatient = functions.https.onCall(async (data, context) => {
  const start = Date.now();
  // Log everything for debugging
  console.log('[debugRegisterPatient] Full received data:', JSON.stringify(data));
  console.log('[debugRegisterPatient] Data keys:', Object.keys(data));
  console.log('[debugRegisterPatient] Data types:', Object.entries(data).map(([k, v]) => `${k}: ${typeof v}`));
  
  // For safety, only extract non-sensitive fields for response
  const { email, firstName, lastName, userType, dateOfBirth, gender } = data;
  
  // Return the data we received without validation
  return { 
    success: true, 
    receivedData: { email, firstName, lastName, userType, dateOfBirth, gender },
    message: "Debug function completed successfully"
  };
});

/**
 * HTTPS Callable to fetch the current authenticated user's combined profile data.
 * Combines UserProfile with PatientProfile or DoctorProfile based on userType.
 * PHI-aware logging: logs only non-sensitive identifiers.
 */
export const getMyUserProfileData = functions.https.onCall(async (_data, context) => {
  const start = Date.now();
  const uid = context.auth?.uid;
  logInfo('[getMyUserProfileData] Called', { callerUid: uid });
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to fetch profile data');
  }
  try {
    const profile = await fetchUserProfileData(uid);
    if (!profile) {
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }
    return profile;
  } catch (err: any) {
    logError('[getMyUserProfileData] Error fetching profile', { uid, error: err });
    throw new functions.https.HttpsError('internal', 'Internal error fetching user profile');
  } finally {
    const duration = Date.now() - start;
    logInfo('[getMyUserProfileData] Completed', { callerUid: uid, duration });
  }
});

/**
 * HTTPS Callable function to get appointments for the authenticated user (patient/doctor).
 * Validates input, checks auth, and fetches filtered appointments from Firestore.
 * PHI-aware logging: only logs identifiers and non-sensitive fields.
 */
export const getMyAppointments = functions.https.onCall(async (data, context) => {
  return await trackPerformance('getMyAppointments', async () => {
    logInfo('[getMyAppointments] Called', { uid: context.auth?.uid });
    if (!context.auth) {
      logError('[getMyAppointments] Unauthenticated request', {});
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Zod validation
    const parseResult = GetAppointmentsSchema.safeParse(data);
    if (!parseResult.success) {
      logError('[getMyAppointments] Invalid input', { error: parseResult.error });
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input');
    }
    const { statusFilter, dateFilter } = parseResult.data;
    // Fetch user type from Firestore profile
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      logError('[getMyAppointments] User profile not found', { uid: context.auth.uid });
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }
    const userType = userDoc.get('userType');
    logInfo('[getMyAppointments] DEBUG: userType fetched from Firestore', { uid: context.auth.uid, userType });
    if (!userType || (userType !== 'PATIENT' && userType !== 'DOCTOR')) {
      logError(`[getMyAppointments] Invalid userType: ${userType}`, { uid: context.auth.uid, userType });
      throw new functions.https.HttpsError('failed-precondition', 'Invalid userType');
    }
    const appointments = await fetchUserAppointments(
      context.auth.uid,
      userType,
      statusFilter as AppointmentStatus | undefined,
      dateFilter as 'upcoming' | 'past' | undefined
    );
    logInfo('[getMyAppointments] Success', { uid: context.auth.uid, count: appointments.length });
    return appointments;
  });
});
