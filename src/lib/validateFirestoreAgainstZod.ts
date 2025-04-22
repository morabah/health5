import { 
  UserProfileSchema, 
  DoctorProfileSchema, 
  PatientProfileSchema, 
  AppointmentSchema,
  NotificationSchema,
  DoctorVerificationDataSchema,
  DoctorVerificationSchema, 
  VerificationDocumentSchema, 
  DoctorAvailabilitySlotSchema,
  TimeSlotSchema, 
  WeeklyScheduleSchema, 
  VerificationRequestSchema,
  VerificationHistoryEntrySchema, 
  SystemLogSchema, 
  EducationEntrySchema,
  ExperienceEntrySchema
} from '@/lib/zodSchemas';
import { collection, getDocs } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/improvedFirebaseClient';

// Map of collection names to their corresponding Zod schemas
const collectionSchemaMap = {
  'users': UserProfileSchema,
  'doctorProfiles': DoctorProfileSchema,
  'patientProfiles': PatientProfileSchema,
  'appointments': AppointmentSchema,
  'notifications': NotificationSchema,
};

// Type for validation results
export interface ValidationResult {
  collection: string;
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  errors: {
    documentId: string;
    errors: string[];
  }[];
}

/**
 * Validates Firestore collections against their corresponding Zod schemas
 * @returns Promise<ValidationResult[]> Results of validation for each collection
 */
export async function validateFirestoreCollections(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const db = await getFirestoreDb();

  for (const [collectionName, schema] of Object.entries(collectionSchemaMap)) {
    try {
      // Get all documents from the collection
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      const result: ValidationResult = {
        collection: collectionName,
        totalDocuments: querySnapshot.size,
        validDocuments: 0,
        invalidDocuments: 0,
        errors: [],
      };

      // Validate each document against its schema
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const validationResult = schema.safeParse(data);
        
        if (validationResult.success) {
          result.validDocuments++;
        } else {
          result.invalidDocuments++;
          
          // Format the errors for better readability
          const formattedErrors = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          );
          
          result.errors.push({
            documentId: doc.id,
            errors: formattedErrors,
          });
        }
      });

      results.push(result);
    } catch (error) {
      console.error(`Error validating collection ${collectionName}:`, error);
      results.push({
        collection: collectionName,
        totalDocuments: 0,
        validDocuments: 0,
        invalidDocuments: 0,
        errors: [{
          documentId: 'FETCH_ERROR',
          errors: [`Failed to fetch or validate collection: ${error instanceof Error ? error.message : String(error)}`]
        }]
      });
    }
  }

  return results;
}

/**
 * Formats validation results as a readable string
 * @param results The validation results to format
 * @returns Formatted string representation of the results
 */
export function formatValidationResults(results: ValidationResult[]): string {
  let output = '🔍 Firestore Schema Validation Results:\n\n';
  
  for (const result of results) {
    output += `Collection: ${result.collection}\n`;
    output += `Total documents: ${result.totalDocuments}\n`;
    output += `Valid documents: ${result.validDocuments}\n`;
    output += `Invalid documents: ${result.invalidDocuments}\n`;
    
    if (result.invalidDocuments > 0) {
      output += '\nErrors:\n';
      
      result.errors.forEach((docError) => {
        output += `\n  Document ID: ${docError.documentId}\n`;
        docError.errors.forEach((error) => {
          output += `    - ${error}\n`;
        });
      });
    }
    
    output += '\n--------------------------------------------------\n\n';
  }
  
  const totalCollections = results.length;
  const totalDocuments = results.reduce((sum, r) => sum + r.totalDocuments, 0);
  const totalValidDocuments = results.reduce((sum, r) => sum + r.validDocuments, 0);
  const totalInvalidDocuments = results.reduce((sum, r) => sum + r.invalidDocuments, 0);
  
  output += `Summary:\n`;
  output += `Total collections validated: ${totalCollections}\n`;
  output += `Total documents validated: ${totalDocuments}\n`;
  output += `Total valid documents: ${totalValidDocuments}\n`;
  output += `Total invalid documents: ${totalInvalidDocuments}\n`;
  
  if (totalInvalidDocuments === 0) {
    output += `\n✅ All documents conform to their Zod schemas!`;
  } else {
    output += `\n❌ Found ${totalInvalidDocuments} documents that don't conform to their Zod schemas.`;
  }
  
  return output;
}
