import { getDoctorDataSource } from '@/config/appConfig';
import { getMockDoctorAvailability } from './mockDataService';
import { getMockDoctorUser } from './mockDataService';
// import { db } from '@/lib/firebaseClient';
// import { collection, getDocs } from 'firebase/firestore';

export interface DoctorAvailabilitySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

/**
 * Loads doctor availability slots with dates converted to display format.
 * Takes weekly recurring slots and generates specific dates for the next 2 weeks.
 */
export async function loadDoctorAvailability(): Promise<DoctorAvailabilitySlot[]> {
  const dataSource = getDoctorDataSource();
  
  if (dataSource === 'mock') {
    // In mock mode, get the weekly availability slots
    const doctorUser = getMockDoctorUser();
    const weeklySlots = getMockDoctorAvailability(doctorUser.id);
    
    // Convert weekly slots to specific dates for the next 14 days
    const displaySlots: DoctorAvailabilitySlot[] = [];
    const today = new Date();
    
    // Generate specific date slots for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Find slots for this day of the week
      const matchingSlots = weeklySlots.filter(slot => slot.dayOfWeek === dayOfWeek);
      
      // Create display slots for each matching time slot
      matchingSlots.forEach(slot => {
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        displaySlots.push({
          id: `${slot.id}_${formattedDate}`,
          date: formattedDate,
          time: slot.startTime,
          available: slot.isAvailable
        });
      });
    }
    
    return displaySlots;
  }
  
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const snapshot = await getDocs(collection(db, 'mockDoctorAvailability'));
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DoctorAvailabilitySlot[];
  // }
  
  throw new Error('No valid data source configured for doctor availability.');
}
