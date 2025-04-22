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
    console.log(`[loadDoctorAvailability] Starting to fetch availability for doctor ${doctorId}`);
    const db = await getFirestoreDb();

    // First, check for exact doctorId match
    console.log(`[loadDoctorAvailability] Attempting to find schedule with doctorId: ${doctorId}`);
    let scheduleQuery = query(
      collection(db, 'doctorSchedules'),
      where('doctorId', '==', doctorId)
    );
    
    let snapshot = await getDocs(scheduleQuery);
    console.log(`[loadDoctorAvailability] Query returned ${snapshot.docs.length} documents with exact match`);
    
    // If no exact match, look for any doctorSchedules document that might have a matching ID
    if (snapshot.empty) {
      console.log(`[loadDoctorAvailability] No exact match found. Retrieving all schedules to check manually.`);
      const allSchedulesQuery = query(collection(db, 'doctorSchedules'));
      const allSchedules = await getDocs(allSchedulesQuery);
      
      if (allSchedules.empty) {
        console.warn(`[loadDoctorAvailability] No doctor schedules found in the entire collection!`);
        return [];
      }
      
      // Log all doctor IDs for debugging
      const scheduleDoctorIds = allSchedules.docs.map(doc => {
        const data = doc.data();
        return {docId: doc.id, doctorId: data.doctorId};
      });
      console.log(`[loadDoctorAvailability] Available doctor schedules:`, scheduleDoctorIds);
      
      // Try using the first available schedule (debug/fallback mode)
      console.log(`[loadDoctorAvailability] Using first available schedule as fallback`);
      snapshot = allSchedules;
    }
    
    // Process the schedule data into appointment slots
    const displaySlots: DoctorAvailabilitySlot[] = [];
    const today = new Date();
    
    snapshot.forEach(doc => {
      const scheduleData = doc.data();
      console.log(`[loadDoctorAvailability] Processing schedule:`, {
        scheduleId: doc.id,
        doctorId: scheduleData.doctorId, 
        slots: scheduleData.slots?.length || 0
      });
      
      const weeklySlots = (scheduleData.slots || []) as WeeklySlot[];
      
      // Generate slots for the next 14 days
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();
        
        // Find slots for this day of week
        const matchingSlots = weeklySlots.filter((slot: WeeklySlot) => slot.dayOfWeek === dayOfWeek);
        
        // Generate display slots for each time slot
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
    
    console.log(`[loadDoctorAvailability] Generated ${displaySlots.length} total slots across ${snapshot.docs.length} schedules`);
    return displaySlots;
  } catch (error) {
    console.error('[loadDoctorAvailability] Error loading doctor availability from Firestore:', error);
    return [];
  }
}
