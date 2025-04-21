#!/usr/bin/env node

/**
 * Minimal script to test Firebase Admin SDK connectivity to Firestore.
 * Prints the list of top-level collections if successful.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in project root.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    const collections = await db.listCollections();
    console.log('Successfully connected! Top-level collections:');
    collections.forEach(col => console.log('- ' + col.id));
    process.exit(0);
  } catch (err) {
    console.error('Firestore connection failed:', err);
    process.exit(1);
  }
})();
