import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { logInfo, logError } from '../shared/logger';
import { trackPerformance } from '../shared/performance';
import { AppointmentStatus, UserType } from '../types/enums';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Zod schema for validating getMyAppointments input.
 */
export const GetAppointmentsSchema = z.object({
  statusFilter: z.nativeEnum(AppointmentStatus).optional(),
  dateFilter: z.enum(['upcoming', 'past']).optional(),
});

/**
 * Fetches appointments for a user, with optional status and date filters.
 * PHI: Only logs count, not full details.
 * @param userId User's UID
 * @param userType 'PATIENT' | 'DOCTOR'
 * @param statusFilter Optional AppointmentStatus
 * @param dateFilter Optional 'upcoming' | 'past'
 * @returns Appointment[]
 */
export async function fetchUserAppointments(
  userId: string,
  userType: UserType,
  statusFilter?: AppointmentStatus,
  dateFilter?: 'upcoming' | 'past'
) {
  return await trackPerformance('fetchUserAppointments', async () => {
    logInfo('[getMyAppointments] Fetching appointments', { userId, userType, statusFilter, dateFilter });
    let query = admin.firestore().collection('appointments')
      .where(userType === 'PATIENT' ? 'patientId' : 'doctorId', '==', userId);

    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    if (dateFilter) {
      const now = Timestamp.now();
      if (dateFilter === 'upcoming') {
        query = query.where('appointmentDate', '>=', now).orderBy('appointmentDate', 'asc');
      } else if (dateFilter === 'past') {
        query = query.where('appointmentDate', '<', now).orderBy('appointmentDate', 'desc');
      }
    } else {
      query = query.orderBy('appointmentDate', 'desc');
    }
    try {
      const snap = await query.get();
      const appointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logInfo('[getMyAppointments] Appointments fetched', { userId, count: appointments.length });
      return appointments;
    } catch (error) {
      logError('[getMyAppointments] Firestore query failed', { userId, userType, error });
      // Return empty array to avoid 500 error on client
      return [];
    }
  });
}
