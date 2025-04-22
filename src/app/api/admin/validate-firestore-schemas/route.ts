import { NextResponse } from 'next/server';
import { validateFirestoreCollections, formatValidationResults } from '@/lib/validateFirestoreAgainstZod';

/**
 * API Route to validate all Firestore collections against their corresponding Zod schemas
 * Protected for admin use only
 */
export async function POST() {
  try {
    // Validate Firestore collections against Zod schemas
    const validationResults = await validateFirestoreCollections();
    
    // Format results for display
    const formattedResults = formatValidationResults(validationResults);
    
    // Calculate summary statistics
    const totalDocuments = validationResults.reduce((sum, r) => sum + r.totalDocuments, 0);
    const validDocuments = validationResults.reduce((sum, r) => sum + r.validDocuments, 0);
    const invalidDocuments = validationResults.reduce((sum, r) => sum + r.invalidDocuments, 0);
    
    return NextResponse.json({ 
      success: true, 
      message: `Validated ${totalDocuments} documents across ${validationResults.length} collections`,
      validDocuments,
      invalidDocuments,
      output: formattedResults,
      results: validationResults 
    });
  } catch (error) {
    console.error('Error validating Firestore collections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to validate Firestore collections: ${error instanceof Error ? error.message : String(error)}`
      }, 
      { status: 500 }
    );
  }
}
