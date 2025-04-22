"use client";

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getFirestoreDb } from '@/lib/improvedFirebaseClient';
import { logValidation } from '@/lib/logger';
import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { DoctorVerificationDataSchema, VerificationDocumentsSchema } from '@/lib/zodSchemas';
import { safeValidateWithZod } from '@/lib/zodValidator';

/**
 * Data Migration Tool Page for Administrators
 * Allows running data migrations to update Firestore documents to match latest schema requirements
 */
export default function DataMigrationPage() {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    updated: number;
    skipped: number;
    errors: number;
    log: string[];
  }>({
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    log: []
  });

  // Helper to add a log entry
  const addLog = (message: string) => {
    setResults(prev => ({
      ...prev,
      log: [...prev.log, `${new Date().toISOString()} - ${message}`]
    }));
  };

  // Required fields for doctor verification documents with correct types
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
    submissionDate: Timestamp.now(),
    lastUpdated: Timestamp.now(),
    adminNotes: ''
  };

  /**
   * Deep validation check for a document
   * Tests field presence and type compatibility
   */
  const validateDocumentStructure = (docData: Record<string, any>) => {
    const issues: string[] = [];
    
    // Check each required field
    for (const [field, expectedValue] of Object.entries(requiredVerificationFields)) {
      // Check field presence
      if (docData[field] === undefined) {
        issues.push(`Missing required field: ${field}`);
        continue;
      }
      
      // Check field type compatibility
      const fieldValue = docData[field];
      
      // Special checks for different field types
      if (field === 'documents') {
        if (typeof fieldValue !== 'object' || fieldValue === null) {
          issues.push(`Field '${field}' should be an object, got ${typeof fieldValue}`);
        } else {
          // Check documents subfields
          const requiredDocFields = ['licenseDocument', 'medicalCertificates', 'identityProof'];
          for (const docField of requiredDocFields) {
            if (fieldValue[docField] === undefined) {
              issues.push(`Missing documents subfield: ${docField}`);
            }
          }
        }
      } else if (field === 'submissionDate' || field === 'lastUpdated') {
        // Handle date fields - allow both Date and Firebase Timestamp
        const isDate = fieldValue instanceof Date;
        const isTimestamp = typeof fieldValue === 'object' && 
                           fieldValue !== null && 
                           'toDate' in fieldValue && 
                           typeof fieldValue.toDate === 'function';
        
        if (!isDate && !isTimestamp) {
          issues.push(`Field '${field}' should be a Date or Timestamp, got ${typeof fieldValue}`);
        }
      }
    }
    
    return issues;
  };

  /**
   * Run the doctor verification data migration
   */
  const migrateVerificationDocuments = async () => {
    setMigrating(true);
    setResults({
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      log: []
    });
    
    try {
      addLog('Starting doctor verification data migration...');
      
      // Get Firestore instance
      const db = await getFirestoreDb();
      
      // Get all doctor verification documents
      const snapshot = await getDocs(collection(db, 'doctorVerifications'));
      const totalDocs = snapshot.docs.length;
      
      addLog(`Found ${totalDocs} doctor verification documents.`);
      setResults(prev => ({ ...prev, total: totalDocs }));
      
      // Create a batch for batch updates
      const batch = writeBatch(db);
      let batchCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Process each document
      for (const docSnapshot of snapshot.docs) {
        try {
          const docId = docSnapshot.id;
          const docData = docSnapshot.data();
          
          // Check for structural issues with the document
          const structuralIssues = validateDocumentStructure(docData);
          
          // If no structural issues and we've already migrated, skip
          if (structuralIssues.length === 0 && docData._migratedAt) {
            addLog(`Document ${docId} already migrated and has correct structure. Skipping.`);
            skippedCount++;
            continue;
          }
          
          // Log any structural issues
          if (structuralIssues.length > 0) {
            addLog(`Document ${docId} has structural issues: ${structuralIssues.join('; ')}`);
          }
          
          // Normalize doctorId vs userId
          const doctorId = docData.doctorId || docData.userId || docId;
          
          // Create updated document with required fields and correct types
          const updatedDoc: Record<string, any> = {
            ...docData,
            doctorId: doctorId,
            fullName: docData.fullName || docData.name || '',
            specialty: docData.specialty || '',
            licenseNumber: docData.licenseNumber || '',
            licenseAuthority: docData.licenseAuthority || '',
            status: docData.status || docData.verificationStatus || 'PENDING',
            lastUpdated: docData.lastUpdated instanceof Timestamp ? 
                         docData.lastUpdated : 
                         Timestamp.now(),
            adminNotes: docData.adminNotes || docData.notes || docData.verificationNotes || '',
            _migratedAt: Timestamp.now() // Track migration timestamp
          };
          
          // Ensure submissionDate is a Timestamp
          if (!docData.submissionDate) {
            updatedDoc.submissionDate = docData.dateSubmitted instanceof Timestamp ? 
                                       docData.dateSubmitted : 
                                       Timestamp.now();
          } else if (!(docData.submissionDate instanceof Timestamp)) {
            // Convert to Timestamp if it's not already
            if (docData.submissionDate instanceof Date) {
              updatedDoc.submissionDate = Timestamp.fromDate(docData.submissionDate);
            } else {
              updatedDoc.submissionDate = Timestamp.now();
            }
          }
          
          // Handle documents object with proper structure
          if (!docData.documents || structuralIssues.some(issue => issue.includes('documents'))) {
            updatedDoc.documents = {
              licenseDocument: docData.licenseUrl || docData.licenseDocumentUrl || null,
              medicalCertificates: Array.isArray(docData.certificates) ? 
                                  docData.certificates : 
                                  Array.isArray(docData.medicalCertificates) ? 
                                  docData.medicalCertificates : [],
              identityProof: docData.identificationUrl || docData.identityProof || null
            };
          }
          
          // Validate with Zod for more thorough field validation
          const docValidation = safeValidateWithZod(DoctorVerificationDataSchema, updatedDoc, {
            contextName: 'migration-verification-data',
            logErrors: false
          });
          
          if (!docValidation.success) {
            addLog(`Document ${docId} failed Zod validation: ${docValidation.error}`);
            
            // Make additional fixes for common Zod validation issues
            if (docValidation.error?.includes('documents')) {
              // Validate documents separately to get detailed errors
              const docsValidation = safeValidateWithZod(
                VerificationDocumentsSchema, 
                updatedDoc.documents || {}, 
                { logErrors: false }
              );
              
              if (!docsValidation.success) {
                addLog(`Documents field issues: ${docsValidation.error}`);
                
                // Reset documents to a valid structure
                updatedDoc.documents = {
                  licenseDocument: null,
                  medicalCertificates: [],
                  identityProof: null
                };
              }
            }
          }
          
          // Add to batch
          const docRef = doc(db, 'doctorVerifications', docId);
          batch.update(docRef, updatedDoc);
          batchCount++;
          
          // Commit batch if it reaches 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            addLog(`Batch of ${batchCount} updates committed successfully.`);
            batchCount = 0;
          }
          
          updatedCount++;
          addLog(`Document ${docId} processed successfully.`);
          
        } catch (error) {
          errorCount++;
          addLog(`Error processing document ${docSnapshot.id}: ${(error as Error).message}`);
        }
      }
      
      // Commit remaining batch operations
      if (batchCount > 0) {
        await batch.commit();
        addLog(`Final batch of ${batchCount} updates committed successfully.`);
      }
      
      // Update results
      setResults(prev => ({
        ...prev,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
      }));
      
      addLog('Migration completed successfully!');
      
    } catch (error) {
      addLog(`Migration failed with error: ${(error as Error).message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <main className="p-6">
      <Card className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">Data Migration Tools</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          These tools help update Firestore documents to match the latest schema requirements.
          Always backup your Firestore data before running migrations.
        </p>
      </Card>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Doctor Verification Migration</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Updates doctor verification documents to include all required fields according to the latest schema:
          <code className="block bg-gray-100 dark:bg-gray-800 p-2 mt-2 rounded text-sm whitespace-pre">
{`- fullName
- specialty
- licenseNumber 
- licenseAuthority
- status (normalized)
- documents structure
- submissionDate
- lastUpdated
- adminNotes`}
          </code>
        </p>
        
        <Button 
          onClick={migrateVerificationDocuments} 
          disabled={migrating}
          className="mb-4"
          pageName="admin-data-migration"
        >
          {migrating ? 'Migrating...' : 'Run Migration'}
        </Button>
        
        {(results.log.length > 0 || migrating) && (
          <>
            <h3 className="text-lg font-medium mt-6 mb-2">Migration Results</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-semibold">{results.total}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Updated</p>
                <p className="text-2xl font-semibold text-green-700 dark:text-green-300">{results.updated}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Skipped</p>
                <p className="text-2xl font-semibold text-yellow-700 dark:text-yellow-300">{results.skipped}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-2xl font-semibold text-red-700 dark:text-red-300">{results.errors}</p>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Migration Log</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-96 overflow-y-auto text-sm font-mono">
              {results.log.map((log, i) => (
                <div key={i} className="mb-1 pb-1 border-b border-gray-200 dark:border-gray-700">
                  {log}
                </div>
              ))}
              {migrating && (
                <div className="mt-2 text-blue-600 dark:text-blue-400 animate-pulse">
                  Migration in progress...
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
