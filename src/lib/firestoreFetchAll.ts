// NOTE: This file is for CMS/validation tooling only. Do NOT use in production app logic. Use loader abstraction for all Firestore access.
// throw new Error("firestoreFetchAll.ts is deprecated. Use data loader abstraction instead.");

import { app, db } from '@/lib/improvedFirebaseClient';
import { collection, getDocs } from "firebase/firestore";

/**
 * Fetches all main Firestore collections and returns them in the offlineMockData.json structure.
 * Collections: users, patients, doctors, appointments, notifications, availability, verificationDocs
 * Note: For doctors, fetches only the main doc, not subcollections 
 */
export async function getAllFirestoreData(): Promise<Record<string, any[]>> {
  try {
    if (!db) {
      throw new Error("Firestore is not initialized. Make sure firebaseClient.ts initializes Firestore with long polling.");
    }
    const collections = [
      "users",
      "patients",
      "doctors",
      "appointments",
      "notifications",
      "availability",
      "verificationDocs",
    ];
    const data: Record<string, any[]> = {};
    for (const col of collections) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const snapshot = await getDocs(collection(db, col));
        data[col] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.error(`[CMS] Error fetching collection ${col}:`, err);
      }
    }
    // Optionally, keep a summary log for success
    // console.info('[CMS] Firestore fetch complete');
    return data;
  } catch (err) {
    console.error('[CMS] getAllFirestoreData error:', err);
    throw err;
  }
}

// Attach getAllFirestoreData to window for CMS/validation tooling
if (typeof window !== "undefined") {
  (window as any).getAllFirestoreData = getAllFirestoreData;
}
