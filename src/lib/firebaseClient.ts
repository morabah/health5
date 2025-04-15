/**
 * Firebase Client SDK Initialization (Conditional)
 *
 * This module initializes the Firebase Client SDK for the Health Appointment System.
 * Initialization occurs only when API mode is set to 'live' or during SSR/builds (window is undefined).
 * When API mode is 'mock' on the client, no Firebase services are initialized and all exports are null.
 *
 * Exports may be null if API mode is 'mock' and running client-side. Always check before use.
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
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
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

// Initialize Firebase only if in live mode or during SSR/builds
if (process.env.NEXT_PUBLIC_API_MODE === 'live' || typeof window === 'undefined') {
  if (getApps().length === 0) {
    logInfo('Initializing Firebase Client SDK...');
    app = initializeApp(firebaseConfig);
    logInfo('Firebase Client SDK Initialized.');

    // Attempt to enable persistence only on the client in live mode
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_MODE === 'live') {
      enableIndexedDbPersistence(getFirestore(app))
        .then(() => logInfo('Firestore offline persistence enabled.'))
        .catch((err) => logWarn('Firestore persistence failed:', { code: err.code, message: err.message }));
    }
  } else {
    app = getApp(); // Get existing app
    logInfo('Using existing Firebase Client SDK App instance.');
  }
} else {
  logInfo(`Firebase Client SDK initialization skipped (API_MODE is '${process.env.NEXT_PUBLIC_API_MODE}').`);
}

/**
 * Firebase Auth instance.
 * May be null if API mode is 'mock' and running client-side.
 */
export const auth: Auth | null = app ? getAuth(app) : null;

/**
 * Firestore instance.
 * May be null if API mode is 'mock' and running client-side.
 */
export const db: Firestore | null = app ? getFirestore(app) : null;

// Add additional exports (storage, messaging, etc.) as needed, following the same pattern.

export { app };
