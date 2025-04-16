/**
 * Firebase Client SDK Initialization (Conditional)
 *
 * This module initializes the Firebase Client SDK for the Health Appointment System.
 * Initialization is handled by the exported `initializeFirebaseClient` function.
 *
 * Exports:
 * - initializeFirebaseClient: Function to initialize Firebase based on current API mode.
 * - app: The initialized FirebaseApp instance (null until initialized).
 * - auth: The Firebase Auth instance (null until initialized).
 * - db: The Firestore instance (null until initialized).
 *
 * Environment variables required (see .env.local):
 *   - NEXT_PUBLIC_FIREBASE_API_KEY
 *   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   - NEXT_PUBLIC_FIREBASE_APP_ID
 *   - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
 *   - NEXT_PUBLIC_API_MODE
 *   - NEXT_PUBLIC_LOG_LEVEL
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  type Firestore 
} from 'firebase/firestore';
import { logInfo, logWarn } from './logger';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Initializes the Firebase Client SDK based on the provided API mode.
 * Ensures Firebase is only initialized once.
 * @param {string} currentApiMode - The current API mode ('live' or 'mock').
 * @returns {{ app: FirebaseApp | null, auth: Auth | null, db: Firestore | null }}
 */
export function initializeFirebaseClient(currentApiMode: string): { app: FirebaseApp | null, auth: Auth | null, db: Firestore | null } {
  // Determine the effective mode: use passed mode on client, env var on server
  const mode = typeof window !== 'undefined' ? currentApiMode : (process.env.NEXT_PUBLIC_API_MODE || 'mock');

  logInfo(`Attempting Firebase initialization with mode: ${mode}`);

  // Only initialize if in 'live' mode
  if (mode !== 'live') {
    logInfo(`Firebase Client SDK initialization skipped (effective mode is '${mode}').`);
    // Ensure instances are null if switching from live to mock
    app = null;
    auth = null;
    db = null;
    return { app, auth, db };
  }

  // Proceed with initialization if in 'live' mode
  if (getApps().length === 0) {
    try {
      logInfo('Initializing Firebase Client SDK...');
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      
      // Use the modern firestore initialization with multi-tab support
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      
      logInfo('Firebase Client SDK Initialized with multi-tab synchronization.');
      
    } catch (error) {
      logWarn('Firebase initialization failed:', { error });
      app = null;
      auth = null;
      db = null;
    }
  } else {
    app = getApp(); // Get existing app
    // Ensure auth and db instances are also fetched if app already exists
    if (!auth) auth = getAuth(app);
    if (!db) db = getFirestore(app);
    logInfo('Using existing Firebase Client SDK App instance.');
  }

  return { app, auth, db };
}

// Export the instances so they can be potentially accessed directly
// after initialization, though using the return value of initializeFirebaseClient
// is safer.
export { app, auth, db };
