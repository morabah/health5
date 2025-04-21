import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Appointment } from '@/types/appointment';
import { AppointmentStatus, UserType } from '@/types/enums';

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
 * Loads appointments for a user (either patient or doctor)
 */
export async function loadAppointments(
  userId: string,
  userType: UserType,
  statusFilter?: AppointmentStatus[]
): Promise<Appointment[]> {
  try {
    const db = await getFirestoreDb();
    const appointmentsRef = collection(db, 'appointments');
    let q = query(
      appointmentsRef,
      where(userType === 'PATIENT' ? 'patientId' : 'doctorId', '==', userId)
    );
    if (statusFilter && statusFilter.length === 1) {
      q = query(q, where('status', '==', statusFilter[0]));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error('Error loading appointments from Firestore:', error);
    throw new Error(`Failed to load appointments: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new appointment
 */
export async function createAppointment(
  patientId: string,
  doctorId: string,
  appointmentDate: Date,
  appointmentType: string
): Promise<Appointment> {
  try {
    const db = await getFirestoreDb();
    const appointmentsRef = collection(db, 'appointments');
    const startTime = '09:00';
    const endTime = '09:30';
    const appointmentData = {
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      status: AppointmentStatus.PENDING,
      reason: 'General consultation',
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      appointmentType: (appointmentType as 'In-person' | 'Video') || 'In-person',
    };
    const docRef = await addDoc(appointmentsRef, appointmentData);
    return { id: docRef.id, ...appointmentData, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    console.error('Error creating appointment in Firestore:', error);
    throw new Error(`Failed to create appointment: ${error instanceof Error ? error.message : String(error)}`);
  }
} 