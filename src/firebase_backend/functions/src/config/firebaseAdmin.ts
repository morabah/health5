import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/** Initializes Firebase Admin SDK implicitly. Ensures it runs only once. */
try {
  if (admin.apps.length === 0) { // Prevent re-initialization on warm starts
    admin.initializeApp();
    functions.logger.info('[Admin SDK] Initialized successfully.');
  }
} catch (error: any) {
  functions.logger.error('[Admin SDK] Initialization error:', error.message, { stack: error.stack });
}

/** Firestore Admin instance */
export const db = admin.firestore();
/** Firebase Auth Admin instance */
export const auth = admin.auth();
/** Firebase Storage Admin instance (Default Bucket) */
// export const storageBucket = admin.storage().bucket(); // Uncomment if needed
