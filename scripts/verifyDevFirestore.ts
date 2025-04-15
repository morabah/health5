/**
 * Script to verify Firestore dev database integrity against mock data.
 * Usage: npm run db:verify:dev
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const {
  mockPatientUser,
  mockDoctorUser,
  mockAdminUser,
  mockPatientProfileData,
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorAvailabilitySlot,
  mockVerificationDocument,
  mockAppointmentsArray,
  mockNotificationsArray,
} = require('./mockDataForScripts');

// Load Zod schemas
const {
  UserProfileSchema,
  PatientProfileSchema,
  DoctorProfileSchema,
  DoctorAvailabilitySlotSchema,
  VerificationDocumentSchema,
  AppointmentSchema,
  NotificationSchema,
} = require('./zodSchemas');

// TODO: Replace with your actual dev Firestore URL
const databaseURL = 'YOUR_DEV_FIRESTORE_URL';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.firestore();

/**
 * Compare specified fields between two objects and return a list of differing field names.
 * @param obj1 The first object to compare.
 * @param obj2 The second object to compare.
 * @param fields The field names to compare.
 * @returns A list of field names that differ between the two objects.
 */
function compareFields(obj1: Record<string, unknown>, obj2: Record<string, unknown>, fields: string[]): string[] {
  const diffs: string[] = [];
  for (const key of fields) {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      diffs.push(key);
    }
  }
  return diffs;
}

/**
 * Verify a Firestore document matches the expected mock data for specified fields.
 * @param collection The Firestore collection to verify.
 * @param id The ID of the document to verify.
 * @param expected The expected mock data for the document.
 * @param fields The field names to verify.
 * @returns True if the document matches the expected mock data, false otherwise.
 */
async function verifyDocument(
  collection: string,
  id: string,
  expected: Record<string, unknown>,
  fields: string[]
): Promise<boolean> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) {
    console.error(`❌ Missing document: ${collection}/${id}`);
    return false;
  }
  const data = doc.data();
  const diffs = compareFields(data || {}, expected, fields);
  if (diffs.length > 0) {
    console.error(`❌ Field mismatch in ${collection}/${id}:`, diffs);
    return false;
  }
  console.log(`✅ Verified: ${collection}/${id}`);
  return true;
}

/**
 * Main function to verify all Firestore mock data.
 */
async function main(): Promise<void> {
  let allPassed = true;
  // USERS
  allPassed &&= await verifyDocument('users', mockPatientUser.id, mockPatientUser, Object.keys(mockPatientUser));
  try {
    const doc = await db.collection('users').doc(mockPatientUser.id).get();
    UserProfileSchema.parse(doc.data());
    console.log('✅ UserProfile structure valid for users/' + mockPatientUser.id);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // ZodError has .errors
      // @ts-ignore
      console.error('❌ Structure error in users/' + mockPatientUser.id + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in users/' + mockPatientUser.id + ':', err);
    }
  }
  allPassed &&= await verifyDocument('users', mockDoctorUser.id, mockDoctorUser, Object.keys(mockDoctorUser));
  try {
    const doc = await db.collection('users').doc(mockDoctorUser.id).get();
    UserProfileSchema.parse(doc.data());
    console.log('✅ UserProfile structure valid for users/' + mockDoctorUser.id);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // @ts-ignore
      console.error('❌ Structure error in users/' + mockDoctorUser.id + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in users/' + mockDoctorUser.id + ':', err);
    }
  }
  allPassed &&= await verifyDocument('users', mockAdminUser.id, mockAdminUser, Object.keys(mockAdminUser));
  try {
    const doc = await db.collection('users').doc(mockAdminUser.id).get();
    UserProfileSchema.parse(doc.data());
    console.log('✅ UserProfile structure valid for users/' + mockAdminUser.id);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // @ts-ignore
      console.error('❌ Structure error in users/' + mockAdminUser.id + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in users/' + mockAdminUser.id + ':', err);
    }
  }

  // PATIENTS
  allPassed &&= await verifyDocument('patients', mockPatientProfileData.userId, mockPatientProfileData, Object.keys(mockPatientProfileData));
  try {
    const doc = await db.collection('patients').doc(mockPatientProfileData.userId).get();
    PatientProfileSchema.parse(doc.data());
    console.log('✅ PatientProfile structure valid for patients/' + mockPatientProfileData.userId);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // @ts-ignore
      console.error('❌ Structure error in patients/' + mockPatientProfileData.userId + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in patients/' + mockPatientProfileData.userId + ':', err);
    }
  }

  // DOCTORS
  allPassed &&= await verifyDocument('doctors', mockDoctorProfileData1.userId, mockDoctorProfileData1, Object.keys(mockDoctorProfileData1));
  try {
    const doc = await db.collection('doctors').doc(mockDoctorProfileData1.userId).get();
    DoctorProfileSchema.parse(doc.data());
    console.log('✅ DoctorProfile structure valid for doctors/' + mockDoctorProfileData1.userId);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // @ts-ignore
      console.error('❌ Structure error in doctors/' + mockDoctorProfileData1.userId + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in doctors/' + mockDoctorProfileData1.userId + ':', err);
    }
  }
  allPassed &&= await verifyDocument('doctors', mockDoctorProfileData2.userId, mockDoctorProfileData2, Object.keys(mockDoctorProfileData2));
  try {
    const doc = await db.collection('doctors').doc(mockDoctorProfileData2.userId).get();
    DoctorProfileSchema.parse(doc.data());
    console.log('✅ DoctorProfile structure valid for doctors/' + mockDoctorProfileData2.userId);
  } catch (err) {
    allPassed = false;
    if (err instanceof Error) {
      // @ts-ignore
      console.error('❌ Structure error in doctors/' + mockDoctorProfileData2.userId + ':', err.errors || err.message);
    } else {
      console.error('❌ Structure error in doctors/' + mockDoctorProfileData2.userId + ':', err);
    }
  }

  // AVAILABILITY (as subcollection)
  if (mockDoctorAvailabilitySlot.id !== undefined) {
    const availRef = db.collection('doctors').doc(mockDoctorProfileData1.userId).collection('availability').doc(mockDoctorAvailabilitySlot.id);
    const availDoc = await availRef.get();
    if (!availDoc.exists) {
      console.error(`❌ Missing availability: doctors/${mockDoctorProfileData1.userId}/availability/${mockDoctorAvailabilitySlot.id}`);
      allPassed = false;
    } else {
      const diffs = compareFields(availDoc.data() || {}, mockDoctorAvailabilitySlot, Object.keys(mockDoctorAvailabilitySlot));
      if (diffs.length > 0) {
        console.error(`❌ Field mismatch in availability:`, diffs);
        allPassed = false;
      } else {
        try {
          DoctorAvailabilitySlotSchema.parse(availDoc.data());
          console.log(`✅ DoctorAvailabilitySlot structure valid for doctors/${mockDoctorProfileData1.userId}/availability/${mockDoctorAvailabilitySlot.id}`);
        } catch (err) {
          allPassed = false;
          if (err instanceof Error) {
            // @ts-ignore
            console.error(`❌ Structure error in doctors/${mockDoctorProfileData1.userId}/availability/${mockDoctorAvailabilitySlot.id}:`, err.errors || err.message);
          } else {
            console.error(`❌ Structure error in doctors/${mockDoctorProfileData1.userId}/availability/${mockDoctorAvailabilitySlot.id}:`, err);
          }
        }
      }
    }
  }

  // VERIFICATION DOCS (as subcollection)
  if (mockVerificationDocument.id !== undefined) {
    const verifRef = db.collection('doctors').doc(mockDoctorProfileData1.userId).collection('verificationDocs').doc(mockVerificationDocument.id);
    const verifDoc = await verifRef.get();
    if (!verifDoc.exists) {
      console.error(`❌ Missing verificationDoc: doctors/${mockDoctorProfileData1.userId}/verificationDocs/${mockVerificationDocument.id}`);
      allPassed = false;
    } else {
      const diffs = compareFields(verifDoc.data() || {}, mockVerificationDocument, Object.keys(mockVerificationDocument));
      if (diffs.length > 0) {
        console.error(`❌ Field mismatch in verificationDoc:`, diffs);
        allPassed = false;
      } else {
        try {
          VerificationDocumentSchema.parse(verifDoc.data());
          console.log(`✅ VerificationDocument structure valid for doctors/${mockDoctorProfileData1.userId}/verificationDocs/${mockVerificationDocument.id}`);
        } catch (err) {
          allPassed = false;
          if (err instanceof Error) {
            // @ts-ignore
            console.error(`❌ Structure error in doctors/${mockDoctorProfileData1.userId}/verificationDocs/${mockVerificationDocument.id}:`, err.errors || err.message);
          } else {
            console.error(`❌ Structure error in doctors/${mockDoctorProfileData1.userId}/verificationDocs/${mockVerificationDocument.id}:`, err);
          }
        }
      }
    }
  }

  // APPOINTMENTS
  for (const appt of mockAppointmentsArray) {
    if (appt.id !== undefined) {
      allPassed &&= await verifyDocument('appointments', appt.id, appt, Object.keys(appt));
      try {
        const doc = await db.collection('appointments').doc(appt.id).get();
        AppointmentSchema.parse(doc.data());
        console.log('✅ Appointment structure valid for appointments/' + appt.id);
      } catch (err) {
        allPassed = false;
        if (err instanceof Error) {
          // @ts-ignore
          console.error('❌ Structure error in appointments/' + appt.id + ':', err.errors || err.message);
        } else {
          console.error('❌ Structure error in appointments/' + appt.id + ':', err);
        }
      }
    }
  }

  // NOTIFICATIONS
  for (const notif of mockNotificationsArray) {
    if (notif.id !== undefined) {
      allPassed &&= await verifyDocument('notifications', notif.id, notif, Object.keys(notif));
      try {
        const doc = await db.collection('notifications').doc(notif.id).get();
        NotificationSchema.parse(doc.data());
        console.log('✅ Notification structure valid for notifications/' + notif.id);
      } catch (err) {
        allPassed = false;
        if (err instanceof Error) {
          // @ts-ignore
          console.error('❌ Structure error in notifications/' + notif.id + ':', err.errors || err.message);
        } else {
          console.error('❌ Structure error in notifications/' + notif.id + ':', err);
        }
      }
    }
  }

  if (allPassed) {
    console.log('🎉 All Firestore mock data verified successfully and complies with data structures!');
    process.exit(0);
  } else {
    console.error('❌ Firestore data verification failed or structure mismatch. See errors above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error verifying Firestore:', err);
  process.exit(1);
});
