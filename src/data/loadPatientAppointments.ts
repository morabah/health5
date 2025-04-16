import { getPatientDataSource } from '@/config/appConfig';
// import { db } from '@/lib/firebaseClient';
// import { collection, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import { Appointment } from '@/types/appointment';

/**
 * Loads patient appointments from the configured data source (mock or Firestore).
 */
export async function loadPatientAppointments(patientId: string, afterDate?: any, max: number = 3): Promise<Appointment[]> {
  const dataSource = getPatientDataSource ? getPatientDataSource() : 'firestore';
  if (dataSource === 'mock') {
    // Mock data for demo/testing
    return [
      { id: 'a1', patientId, doctorId: 'd1', appointmentDate: '2025-04-18', status: 'upcoming' },
      { id: 'a2', patientId, doctorId: 'd2', appointmentDate: '2025-04-20', status: 'completed' }
    ];
  }
  // Uncomment and implement Firestore logic as needed
  // if (dataSource === 'firestore') {
  //   const q = query(
  //     collection(db, 'appointments'),
  //     where('patientId', '==', patientId),
  //     where('appointmentDate', '>=', afterDate ?? Timestamp.now()),
  //     orderBy('appointmentDate', 'asc'),
  //     limit(max)
  //   );
  //   const snap = await getDocs(q);
  //   const appts: Appointment[] = [];
  //   snap.forEach((doc) => appts.push({ id: doc.id, ...doc.data() } as Appointment));
  //   return appts;
  // }
  throw new Error('No valid data source configured for patient appointments.');
}
