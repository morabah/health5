import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface WeeklySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  isAvailable: boolean;
}

export interface DoctorAvailabilitySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

/**
 * Gets a properly initialized Firebase Firestore instance
 */
async function getFirestoreDb() {
  const { db } = initializeFirebaseClient('live');
  if (!db) {
    throw new Error('Firebase Firestore is not available');
  }
  return db;
}

/**
 * Loads doctor availability slots from Firestore and generates dates for the next 14 days.
 */
export async function loadDoctorAvailability(doctorId: string): Promise<DoctorAvailabilitySlot[]> {
  try {
    const db = await getFirestoreDb();
    const scheduleQuery = query(
      collection(db, 'doctorSchedules'),
      where('doctorId', '==', doctorId)
    );
    const snapshot = await getDocs(scheduleQuery);
    if (snapshot.empty) {
      console.warn(`No availability schedule found for doctor ${doctorId}`);
      return [];
    }
    const displaySlots: DoctorAvailabilitySlot[] = [];
    const today = new Date();
    snapshot.forEach(doc => {
      const scheduleData = doc.data();
      const weeklySlots = (scheduleData.slots || []) as WeeklySlot[];
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();
        const matchingSlots = weeklySlots.filter((slot: WeeklySlot) => slot.dayOfWeek === dayOfWeek);
        matchingSlots.forEach((slot: WeeklySlot) => {
          const formattedDate = date.toISOString().split('T')[0];
          displaySlots.push({
            id: `${slot.id}_${formattedDate}`,
            date: formattedDate,
            time: slot.startTime,
            available: slot.isAvailable
          });
        });
      }
    });
    return displaySlots;
  } catch (error) {
    console.error('Error loading doctor availability from Firestore:', error);
    throw error;
  }
}
