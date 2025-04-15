// fixFirestoreAllCollections.js
// Script to debug and auto-fix all Firestore collections using Zod schemas
// Run: GOOGLE_APPLICATION_CREDENTIALS=... GOOGLE_CLOUD_PROJECT=... node scripts/fixFirestoreAllCollections.js

const admin = require('firebase-admin');
const { UserProfileSchema, PatientProfileSchema, DoctorProfileSchema, DoctorAvailabilitySlotSchema, VerificationDocumentSchema, AppointmentSchema, NotificationSchema } = require('./zodSchemas');

const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const schemaMap = {
  users: UserProfileSchema,
  patients: PatientProfileSchema,
  doctors: DoctorProfileSchema,
  availability: DoctorAvailabilitySlotSchema,
  verificationDocs: VerificationDocumentSchema,
  appointments: AppointmentSchema,
  notifications: NotificationSchema,
};

async function fetchAllDocs(colName) {
  const snap = await db.collection(colName).get();
  return snap.docs.map(doc => ({ ...doc.data(), __id: doc.id }));
}

async function fixCollection(colName, schema) {
  const docs = await fetchAllDocs(colName);
  let fixedCount = 0;
  for (const docObj of docs) {
    const updateObj = {};
    let needsUpdate = false;
    const docId = docObj.id || docObj.__id;
    // Print every patient doc ID and relevant fields as scanned
    if (colName === 'patients') {
      console.log(`[SCAN] [patients] (${docId}) gender:`, docObj.gender, '| medicalHistory:', docObj.medicalHistory);
    }
    // DEBUG: Print docId for every patient doc
    if (colName === 'patients') {
      console.log(`[DEBUG] [patients] (${docId}) DOCID CHECK: docId=`, docId, '| docObj.id=', docObj.id);
    }
    const shape = schema._def.shape();
    // --- DEBUG: For patients, log gender and medicalHistory ---
    if (colName === 'patients') {
      console.log(`[DEBUG] [patients] (${docId}) gender:`, docObj.gender, '| medicalHistory:', docObj.medicalHistory);
    }
    for (const [field, def] of Object.entries(shape)) {
      const value = docObj[field];
      // String
      if (def._def.typeName === 'ZodString') {
        if (typeof value !== 'string' || value === undefined || value === null) {
          updateObj[field] = '';
          needsUpdate = true;
          console.log(`[${colName}] (${docId}) Auto-fix: Setting string field '${field}' to ''`);
          if (colName === 'patients' && field === 'medicalHistory') {
            console.log(`[DEBUG] [patients] (${docId}) String field 'medicalHistory' is invalid or missing. Will set to ''.`);
          }
        } else {
          if (colName === 'patients' && field === 'medicalHistory') {
            console.log(`[DEBUG] [patients] (${docId}) String field 'medicalHistory' value '${value}' is valid, no fix needed.`);
          }
        }
      }
      // Boolean
      if (def._def.typeName === 'ZodBoolean') {
        if (typeof value !== 'boolean' || value === undefined || value === null) {
          updateObj[field] = false;
          needsUpdate = true;
          console.log(`[${colName}] (${docId}) Auto-fix: Setting boolean field '${field}' to false`);
        }
      }
      // Number
      if (def._def.typeName === 'ZodNumber') {
        if (typeof value !== 'number' || value === undefined || value === null) {
          updateObj[field] = 0;
          needsUpdate = true;
          console.log(`[${colName}] (${docId}) Auto-fix: Setting number field '${field}' to 0`);
        }
      }
      // Enum (fix using _def.values for Zod v3+)
      if (def._def.typeName === 'ZodEnum') {
        const allowed = def._def.values;
        console.log(`[DEBUG] [${colName}] (${docId}) Enum field '${field}': value='${value}', allowed=`, allowed);
        if (typeof value !== 'string' || value === undefined || value === null || !allowed.includes(value)) {
          console.log(`[DEBUG] [${colName}] (${docId}) Enum field '${field}' value '${value}' is invalid, will fix.`);
          if (allowed.includes('Other')) {
            updateObj[field] = 'Other';
            needsUpdate = true;
            console.log(`[${colName}] (${docId}) Auto-fix: Setting enum field '${field}' to 'Other'`);
          } else {
            updateObj[field] = allowed[0];
            needsUpdate = true;
            console.log(`[${colName}] (${docId}) Auto-fix: Setting enum field '${field}' to '${allowed[0]}'`);
          }
        } else {
          console.log(`[DEBUG] [${colName}] (${docId}) Enum field '${field}' value '${value}' is valid, no fix needed.`);
        }
      }
    }
    // id field (prefer __id if present)
    if ('id' in shape && (typeof docObj.id !== 'string' || docObj.id === undefined || docObj.id === null) && docId) {
      updateObj.id = docId;
      needsUpdate = true;
      console.log(`[${colName}] (${docId}) Auto-fix: Setting id field to docId`);
    }
    // Log the final updateObj and needsUpdate for every patient doc
    if (colName === 'patients') {
      console.log(`[DEBUG] [patients] (${docId}) FINAL updateObj:`, updateObj, '| needsUpdate:', needsUpdate);
    }
    if (needsUpdate && docId) {
      console.log(`[DEBUG] [${colName}] (${docId}) updateObj before Firestore update:`, updateObj);
      await db.collection(colName).doc(docId).update(updateObj);
      fixedCount++;
      console.log(`[${colName}] (${docId}) UPDATED:`, updateObj);
      // Track fixed docs for reporting
      if (!global.fixedDocs) global.fixedDocs = {};
      if (!global.fixedDocs[colName]) global.fixedDocs[colName] = [];
      global.fixedDocs[colName].push(docId);
    }
  }
  // Print which docs were fixed
  if (global.fixedDocs && global.fixedDocs[colName] && global.fixedDocs[colName].length > 0) {
    console.log(`[REPORT] [${colName}] Fixed docs:`, global.fixedDocs[colName]);
  }
  console.log(`[DEBUG] [${colName}] FINAL fixedCount:`, fixedCount);
  return fixedCount;
}

async function main() {
  let summary = [];
  for (const [col, schema] of Object.entries(schemaMap)) {
    console.log(`\nChecking collection: ${col}`);
    const fixed = await fixCollection(col, schema);
    summary.push(`${col}: fixed ${fixed}`);
  }
  console.log('\nData integrity auto-fix complete.');
  summary.forEach(line => console.log(line));
  process.exit(0);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
