// Node.js script to validate offlineMockData.json against Zod schemas
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const schemas = require('./zodSchemas');

const DATA_PATH = path.resolve(__dirname, 'offlineMockData.json');

const schemaMap = {
  users: schemas.UserProfileSchema,
  patients: schemas.PatientProfileSchema,
  doctors: schemas.DoctorProfileSchema,
  availability: schemas.DoctorAvailabilitySlotSchema,
  verificationDocs: schemas.VerificationDocumentSchema,
  appointments: schemas.AppointmentSchema,
  notifications: schemas.NotificationSchema,
};

function validateData(data, source = 'offline') {
  const results = [];
  for (const [key, schema] of Object.entries(schemaMap)) {
    if (data[key]) {
      data[key].forEach((doc, i) => {
        const result = schema.safeParse(doc);
        if (!result.success) {
          results.push(`[${source.toUpperCase()}] ${key}[${i}]: ${JSON.stringify(result.error.issues)}`);
        }
      });
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('offlineMockData.json not found at', DATA_PATH);
    process.exit(1);
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const errors = validateData(data, 'offline');
  if (errors.length === 0) {
    console.log('All offline data structures are valid according to Zod schemas.');
  } else {
    console.log('Data structure validation errors found:');
    errors.forEach(e => console.log(e));
    if (errors.length > 10) {
      console.log(`...and ${errors.length - 10} more`);
    }
  }
}

main();
