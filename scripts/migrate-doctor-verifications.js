/**
 * Doctor Verification Data Migration Script
 * 
 * This script updates all doctor verification documents in Firestore to include
 * all required fields according to the DoctorVerificationDataSchema.
 * 
 * Usage:
 * node scripts/migrate-doctor-verifications.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../firebase-credentials.json');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// Fields that should be present in all doctor verification documents
const requiredVerificationFields = {
  fullName: '',
  specialty: '',
  licenseNumber: '',
  licenseAuthority: '',
  status: 'PENDING',
  documents: {
    licenseDocument: null,
    medicalCertificates: [],
    identityProof: null
  },
  submissionDate: new Date(),
  lastUpdated: new Date(),
  adminNotes: ''
};

// Function to migrate all doctor verification documents
async function migrateVerificationDocuments() {
  console.log('Starting migration of doctor verification documents...');
  
  try {
    // Get all documents from the doctorVerifications collection
    const snapshot = await db.collection('doctorVerifications').get();
    
    console.log(`Found ${snapshot.docs.length} doctor verification documents.`);
    
    // Track total and successfully updated documents
    let totalDocuments = snapshot.docs.length;
    let updatedDocuments = 0;
    let skippedDocuments = 0;
    let errorDocuments = 0;
    
    // Create a backup of existing documents (for safety)
    const backupData = [];
    
    // Process each document
    for (const doc of snapshot.docs) {
      try {
        const docId = doc.id;
        const docData = doc.data();
        
        // Add to backup
        backupData.push({
          id: docId,
          data: docData
        });
        
        // Normalize doctorId vs userId (some documents might use one or the other)
        const doctorId = docData.doctorId || docData.userId || docId;
        
        // Create updated document with required fields
        const updatedDoc = {
          ...docData,
          doctorId: doctorId,
          fullName: docData.fullName || docData.name || '',
          specialty: docData.specialty || '',
          licenseNumber: docData.licenseNumber || '',
          licenseAuthority: docData.licenseAuthority || '',
          status: docData.status || docData.verificationStatus || 'PENDING',
          submissionDate: docData.submissionDate || docData.dateSubmitted || new Date(),
          lastUpdated: docData.lastUpdated || docData.updatedAt || new Date(),
          adminNotes: docData.adminNotes || docData.notes || docData.verificationNotes || ''
        };
        
        // Handle documents object
        if (!updatedDoc.documents) {
          updatedDoc.documents = {
            licenseDocument: docData.licenseUrl || docData.licenseDocumentUrl || null,
            medicalCertificates: docData.certificates || docData.medicalCertificates || [],
            identityProof: docData.identificationUrl || docData.identityProof || null
          };
        }
        
        // Skip update if document already has all required fields
        const hasAllRequiredFields = Object.keys(requiredVerificationFields).every(field => {
          return updatedDoc[field] !== undefined;
        });
        
        if (hasAllRequiredFields) {
          console.log(`Document ${docId} already has all required fields. Skipping.`);
          skippedDocuments++;
          continue;
        }
        
        // Update the document in Firestore
        await db.collection('doctorVerifications').doc(docId).update(updatedDoc);
        console.log(`Document ${docId} updated successfully.`);
        updatedDocuments++;
        
      } catch (error) {
        console.error(`Error updating document ${doc.id}:`, error);
        errorDocuments++;
      }
    }
    
    // Save backup to file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(__dirname, `../backups/doctor-verifications-backup-${timestamp}.json`);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../backups'))) {
      fs.mkdirSync(path.join(__dirname, '../backups'));
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${backupPath}`);
    
    // Print summary
    console.log('\nMigration completed!');
    console.log(`Total documents: ${totalDocuments}`);
    console.log(`Updated documents: ${updatedDocuments}`);
    console.log(`Skipped documents: ${skippedDocuments}`);
    console.log(`Failed documents: ${errorDocuments}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateVerificationDocuments().then(() => {
  console.log('Migration script finished.');
  process.exit(0);
}).catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
