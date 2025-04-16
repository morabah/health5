import { getDoctorDataSource } from '@/config/appConfig';
// import { db } from '@/lib/firebaseClient';
// import { collection, getDocs } from 'firebase/firestore';

export interface DoctorAvailabilitySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export async function loadDoctorAvailability(): Promise<DoctorAvailabilitySlot[]> {
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    return [
      { id: 'slot1', date: '2025-04-18', time: '09:00', available: true },
      { id: 'slot2', date: '2025-04-18', time: '10:00', available: false }
    ];
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const snapshot = await getDocs(collection(db, 'mockDoctorAvailability'));
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DoctorAvailabilitySlot[];
  // }
  throw new Error('No valid data source configured for doctor availability.');
}
