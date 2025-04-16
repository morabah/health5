import { getDoctorDataSource } from '@/config/appConfig';
// import { db } from '@/lib/firebaseClient';
// import { collection, getDocs } from 'firebase/firestore';

export interface DoctorAppointment {
  id: string;
  patient: string;
  date: string;
  status: string;
}

/**
 * Loads doctor appointments from the configured data source (mock or Firestore).
 */
export async function loadDoctorAppointments(): Promise<DoctorAppointment[]> {
  const dataSource = getDoctorDataSource();
  if (dataSource === 'mock') {
    // Mock data
    return [
      { id: '1', patient: 'John Doe', date: '2025-04-18', status: 'upcoming' },
      { id: '2', patient: 'Jane Smith', date: '2025-04-19', status: 'completed' }
    ];
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const snapshot = await getDocs(collection(db, 'mockDoctorAppointments'));
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DoctorAppointment[];
  // }
  throw new Error('No valid data source configured for doctor appointments.');
}
