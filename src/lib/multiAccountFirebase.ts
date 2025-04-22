import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence, browserSessionPersistence, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

/**
 * Get or create a named Firebase app instance for multi-account auth.
 * @param name - Unique app name (e.g. 'doctor', 'patient', 'admin')
 */
export function getFirebaseApp(name: string): FirebaseApp {
  const existing = getApps().find(app => app.name === name);
  if (existing) return getApp(name);
  return initializeApp(firebaseConfig, name);
}

/**
 * Get an Auth instance for a named app, with in-memory persistence for isolation.
 * @param name - Unique app name
 */
export async function getIsolatedAuth(name: string): Promise<Auth> {
  const app = getFirebaseApp(name);
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence); // Use in-memory for true isolation per account/tab
  return auth;
}
