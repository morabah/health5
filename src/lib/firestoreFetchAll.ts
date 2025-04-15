import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebaseClient";

/**
 * Fetches all main Firestore collections and returns them in the offlineMockData.json structure.
 * Collections: users, patients, doctors, appointments, notifications, availability, verificationDocs
 * Note: For doctors, fetches only the main doc, not subcollections 
 */
export async function getAllFirestoreData() {
  if (!app) throw new Error("Firebase app is not initialized (API mode may be 'mock' or missing env vars)");
  const db = getFirestore(app);
  const collections = [
    "users",
    "patients",
    "doctors",
    "availability",
    "verificationDocs",
    "appointments",
    "notifications"
  ];
  const result: Record<string, any[]> = {};
  for (const col of collections) {
    const colRef = collection(db, col);
    const snap = await getDocs(colRef);
    result[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return result;
}

// Attach to window for CMS DataSyncPanel usage
declare global {
  interface Window {
    getAllFirestoreData?: typeof getAllFirestoreData;
  }
}
if (typeof window !== "undefined") {
  window.getAllFirestoreData = getAllFirestoreData;
}
