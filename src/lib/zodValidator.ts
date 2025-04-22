/**
 * Utility for validating data with Zod schemas
 * 
 * This centralizes validation logic using Zod schemas defined in /src/lib/zodSchemas.ts
 * All validation across the application should use these helpers to ensure consistency.
 */
import { z } from 'zod';
import { logValidation } from './logger';

/**
 * Validates data against a Zod schema and returns the parsed result
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param options Additional validation options
 * @returns The validated and parsed data
 * @throws If validation fails
 */
export function validateWithZod<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  options?: {
    errorPrefix?: string;
    logErrors?: boolean;
    contextName?: string;
  }
): z.infer<T> {
  const { errorPrefix = 'Validation Error', logErrors = true, contextName } = options || {};
  
  try {
    // Parse and return valid data
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format error messages
      const formattedErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      
      const errorMessage = `${errorPrefix}: ${formattedErrors}`;
      
      // Log validation errors
      if (logErrors) {
        logValidation(
          contextName || 'data-validation', 
          'error', 
          { error: formattedErrors, data }
        );
      }
      
      throw new Error(errorMessage);
    }
    
    // Re-throw non-Zod errors
    throw error;
  }
}

/**
 * Safe version of validateWithZod that doesn't throw errors
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param options Additional validation options
 * @returns An object with success flag and either data or error
 */
export function safeValidateWithZod<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  options?: {
    logErrors?: boolean;
    contextName?: string;
  }
): { 
  success: boolean; 
  data?: z.infer<T>; 
  error?: string; 
  zodError?: z.ZodError;
} {
  const { logErrors = true, contextName } = options || {};
  
  const result = schema.safeParse(data);
  
  if (!result.success && logErrors) {
    const error = result.error;
    const formattedErrors = error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join('; ');
    
    logValidation(
      contextName || 'data-validation', 
      'warning', 
      { error: formattedErrors, data }
    );
    
    return {
      success: false,
      error: formattedErrors,
      zodError: error
    };
  }
  
  return result.success 
    ? { success: true, data: result.data } 
    : { success: false, error: 'Validation failed', zodError: result.error };
}

/**
 * Validates Firestore document against a Zod schema
 * @param schema The Zod schema to validate against 
 * @param docData The Firestore document data
 * @param docId Optional document ID for better error messages
 * @returns The validated document data
 */
export function validateFirestoreDoc<T extends z.ZodTypeAny>(
  schema: T,
  docData: unknown,
  docId?: string
): z.infer<T> {
  return validateWithZod(schema, docData, {
    errorPrefix: `Firestore document${docId ? ` (ID: ${docId})` : ''} validation failed`,
    contextName: 'firestore-validation'
  });
}
