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
import { getAuth, setPersistence, browserSessionPersistence, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { logInfo, logWarn, logError } from './logger';

// Firebase config for the Healthcare App
// Hardcode critical values to avoid env typo issues
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

// Track initialization status
let initialized = false;

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

  // For /find route, we always want to return Firebase instances even if mode is 'mock'
  const isSpecialRoute = typeof window !== 'undefined' && window.location.pathname.includes('/find');
  if (isSpecialRoute) {
    logInfo('Special route detected (/find), forcing Firebase initialization regardless of mode');
  } else if (mode !== 'live') {
    // Only skip initialization if we're not in a special route and mode is not 'live'
    logInfo(`Firebase Client SDK initialization skipped (effective mode is '${mode}').`);
    return { app: null, auth: null, db: null, analytics: null };
  }

  // If already initialized, return the existing instances
  if (initialized && app && auth && db) {
    logInfo('Firebase already initialized, returning existing instances');
    return { app, auth, db, analytics };
  }

  // Proceed with initialization
  try {
    if (getApps().length === 0) {
      logInfo('Initializing new Firebase Client SDK...');
      app = initializeApp(firebaseConfig);
    } else {
      logInfo('Using existing Firebase app...');
      app = getApp();
    }

    // Initialize Auth with browserSessionPersistence to ensure session is per-tab, not shared across tabs/windows
    if (!auth && app) {
      logInfo('Initializing Firebase Auth...');
      auth = getAuth(app);
      setPersistence(auth, browserSessionPersistence);
    }
    
    // Initialize Firestore with enhanced settings
    if (!db && app) {
      logInfo('Initializing Firestore with optimal settings...');
      try {
        const settings = {
          // Modern Firestore persistence: use cache configuration instead of enableIndexedDbPersistence
          // Persistence is now handled via Firestore settings (cacheSizeBytes, ignoreUndefinedProperties)
          ignoreUndefinedProperties: true,
          cacheSizeBytes: 50 * 1024 * 1024, // 50MB reasonable default
          experimentalAutoDetectLongPolling: true,
          cache: {
            persistenceEnabled: true,
            tabSizeBytes: 50 * 1024 * 1024 // 50MB tab size
          }
        };
        
        db = initializeFirestore(app, settings);
      } catch (firestoreError) {
        logError('Failed to initialize Firestore with optimal settings:', { error: firestoreError });
        
        // Fall back to standard initialization
        try {
          logInfo('Attempting standard Firestore initialization...');
          db = getFirestore(app);
        } catch (fallbackError) {
          logError('Standard Firestore initialization also failed:', { error: fallbackError });
          db = null;
        }
      }
    }
    
    // Initialize Analytics
    if (!analytics && app && typeof window !== 'undefined') {
      try {
        logInfo('Initializing Firebase Analytics...');
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        logWarn('Analytics initialization failed:', { error: analyticsError });
        analytics = null;
      }
    }
    
    // Mark as initialized if we have the core services
    if (app && auth && db) {
      initialized = true;
      logInfo('Firebase Core Services Successfully Initialized');
    } else {
      logWarn('Some Firebase services failed to initialize', {
        appInitialized: !!app,
        authInitialized: !!auth,
        dbInitialized: !!db,
        analyticsInitialized: !!analytics
      });
    }
  } catch (error) {
    logError('Fatal error during Firebase initialization:', { error });
    app = null;
    auth = null;
    db = null;
    analytics = null;
    initialized = false;
  }

  return { app, auth, db, analytics };
}

// Export the instances so they can be potentially accessed directly
// after initialization, though using the return value of initializeFirebaseClient
// is safer.
export { app, auth, db, analytics };
