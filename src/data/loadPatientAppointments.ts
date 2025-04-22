import { getPatientDataSource } from '@/config/appConfig';
// import { db } from '@/lib/firebaseClient';
// import { collection, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import { Appointment } from '@/types/appointment';
import { AppointmentStatus } from '@/types/enums';

/**
 * Loads patient appointments from the configured data source (mock or Firestore).
 */
export async function loadPatientAppointments(patientId: string, afterDate?: any, max: number = 3): Promise<Appointment[]> {
  const dataSource = getPatientDataSource ? getPatientDataSource() : 'firestore';
  if (dataSource === 'mock') {
    // Mock data for demo/testing
    return [
      { id: 'a1', patientId, doctorId: 'd1', appointmentDate: new Date('2025-04-18'), startTime: '09:00', endTime: '09:30', status: AppointmentStatus.CONFIRMED, reason: 'Checkup', notes: '', doctorName: 'Dr. Smith', patientName: 'John Doe', createdAt: new Date(), updatedAt: new Date() },
      { id: 'a2', patientId, doctorId: 'd2', appointmentDate: new Date('2025-04-20'), startTime: '10:00', endTime: '10:30', status: AppointmentStatus.COMPLETED, reason: 'Follow-up', notes: '', doctorName: 'Dr. Jones', patientName: 'Jane Doe', createdAt: new Date(), updatedAt: new Date() }
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
