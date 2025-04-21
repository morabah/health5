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
 * - analytics: The Firebase Analytics instance (null until initialized).
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
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { logInfo, logWarn } from './logger';

// Firebase config for the Healthcare App
// Hardcode critical values to avoid env typo issues
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: 'healthcare-331f1.firebaseapp.com',
  projectId: 'healthcare-331f1',
  storageBucket: 'healthcare-331f1.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID as string,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

/**
 * Initializes the Firebase Client SDK based on the provided API mode.
 * Ensures Firebase is only initialized once.
 * @param {string} currentApiMode - The current API mode ('live' or 'mock').
 * @returns {{ app: FirebaseApp | null, auth: Auth | null, db: Firestore | null, analytics: Analytics | null }}
 */
export function initializeFirebaseClient(currentApiMode: string): { app: FirebaseApp | null, auth: Auth | null, db: Firestore | null, analytics: Analytics | null } {
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
    analytics = null;
    return { app, auth, db, analytics };
  }

  // Proceed with initialization if in 'live' mode
  if (getApps().length === 0) {
    try {
      logInfo('Initializing Firebase Client SDK...');
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      
      // Initialize Firestore with long polling to avoid WebChannel 400 errors
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true
      });
      
      // Initialize Analytics
      analytics = getAnalytics(app);
      
      logInfo('Firebase Client SDK Initialized.');
      
    } catch (error) {
      logWarn('Firebase initialization failed:', { error });
      app = null;
      auth = null;
      db = null;
      analytics = null;
    }
  } else {
    app = getApp(); // Get existing app
    // Ensure auth and db instances are also fetched if app already exists
    if (!auth) auth = getAuth(app);
    // Always use initializeFirestore (with long polling) for db
    // Do NOT fallback to getFirestore(app)
    // db is already initialized on first run
    if (!analytics) analytics = getAnalytics(app);
    logInfo('Using existing Firebase Client SDK App instance.');
  }

  return { app, auth, db, analytics };
}

// Export the instances so they can be potentially accessed directly
// after initialization, though using the return value of initializeFirebaseClient
// is safer.
export { app, auth, db, analytics };
