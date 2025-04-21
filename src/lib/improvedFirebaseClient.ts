/**
 * Improved Firebase Client SDK Initialization
 * 
 * This module incorporates all lessons learned from our API mode and Firebase
 * initialization experiences, implementing best practices for performance,
 * error handling, and caching.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { logInfo, logWarn, logError } from './logger';
import { getApiMode } from '@/config/appConfig';

// Firebase config (hardcoded to avoid env typos)
const firebaseConfig = {
  apiKey: "AIzaSyATegnW0o6bC6NOB6OtsZI501p8_Jy5isw",
  authDomain: "helathcare-331f1.firebaseapp.com",
  projectId: "helathcare-331f1",
  storageBucket: "helathcare-331f1.firebasestorage.app",
  messagingSenderId: "662603978873",
  appId: "1:662603978873:web:4b8102a82647b334419ca8",
  measurementId: "G-LN6HZTXH2R"
};

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let initialized = false;

// Service initialization status for debugging
interface FirebaseStatus {
  appInitialized: boolean;
  authInitialized: boolean;
  dbInitialized: boolean;
  analyticsInitialized: boolean;
  mode: string;
  persistence: boolean;
}

/**
 * Initializes Firebase with improved error handling and optimal settings
 */
export function initializeFirebaseClient(
  forcedMode?: string
): { 
  app: FirebaseApp | null; 
  auth: Auth | null; 
  db: Firestore | null; 
  analytics: Analytics | null;
  status: FirebaseStatus;
} {
  // Get effective mode: forced > route-based > config
  const currentApiMode = forcedMode || getApiMode();
  const isSpecialRoute = typeof window !== 'undefined' && 
    window.location.pathname.includes('/find');
  
  // Determine if we should initialize Firebase
  const shouldInit = currentApiMode === 'live' || isSpecialRoute;
  
  logInfo(`Firebase init requested with mode: ${currentApiMode}${isSpecialRoute ? ' (special route)' : ''}`);
  
  // Status object for returning service state
  const status: FirebaseStatus = {
    appInitialized: !!app,
    authInitialized: !!auth,
    dbInitialized: !!db,
    analyticsInitialized: !!analytics,
    mode: currentApiMode,
    persistence: false
  };
  
  // Skip initialization for mock mode (unless special route)
  if (!shouldInit) {
    logInfo(`Firebase initialization skipped (mode: ${currentApiMode})`);
    return { app: null, auth: null, db: null, analytics: null, status };
  }
  
  // Return existing instances if already initialized
  if (initialized && app && auth && db) {
    logInfo('Firebase already initialized, returning existing instances');
    return { app, auth, db, analytics, status };
  }
  
  try {
    // 1. Initialize Firebase App (or get existing)
    app = getApps().length === 0 
      ? initializeApp(firebaseConfig) 
      : getApp();
    status.appInitialized = true;
    
    // 2. Initialize Auth
    try {
      auth = getAuth(app);
      status.authInitialized = true;
    } catch (authError) {
      logError('Firebase Auth initialization failed', { error: authError });
    }
    
    // 3. Initialize Firestore with improved settings
    try {
      const settings = {
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
        // Modern cache configuration (preferred over enableIndexedDbPersistence)
        cache: {
          persistenceEnabled: true,
          tabSizeBytes: 50 * 1024 * 1024 // 50MB per tab limit
        }
      };
      
      db = initializeFirestore(app, settings);
      status.dbInitialized = true;
      status.persistence = true;
    } catch (firestoreError) {
      logWarn('Optimal Firestore initialization failed, trying standard initialization', 
        { error: firestoreError });
      
      try {
        // Fallback to standard configuration
        db = getFirestore(app);
        status.dbInitialized = true;
      } catch (fallbackError) {
        logError('All Firestore initialization attempts failed', { error: fallbackError });
      }
    }
    
    // 4. Initialize Analytics (client-side only)
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
        status.analyticsInitialized = true;
      } catch (analyticsError) {
        logWarn('Analytics initialization skipped', { error: analyticsError });
      }
    }
    
    // Update initialization status
    initialized = !!(app && auth && db);
    
    if (initialized) {
      logInfo('Firebase core services successfully initialized');
    } else {
      logWarn('Firebase initialization incomplete', status);
    }
    
  } catch (error) {
    logError('Critical Firebase initialization failure', { error });
    
    // Reset state on critical failure
    app = null;
    auth = null;
    db = null;
    analytics = null;
    initialized = false;
    
    Object.keys(status).forEach(key => {
      if (key !== 'mode' && key !== 'persistence') {
        (status as any)[key] = false;
      }
    });
  }
  
  return { app, auth, db, analytics, status };
}

// Export singleton instances and initialization function
export { app, auth, db, analytics };

// Helper to determine if Firebase is ready for use
export function isFirebaseReady(): boolean {
  return initialized && !!app && !!auth && !!db;
}

// Optional cleanup function for testing/hot module replacement
export function cleanupFirebase(): void {
  initialized = false;
}

// Helper: get a ready Firestore instance, initializing Firebase if needed
export async function getFirestoreDb(): Promise<Firestore> {
  const { db } = initializeFirebaseClient();
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
}