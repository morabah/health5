import * as functions from 'firebase-functions';
import { z } from 'zod';
import { GetAppointmentsSchema, fetchUserAppointments } from './appointmentManagement';
import { getUserTypeFromAuth } from '../shared/userUtils';
import { logInfo, logError } from '../shared/logger';
import { trackPerformance } from '../shared/performance';
import { HttpsError } from 'firebase-functions/v1/https';

/**
 * Callable function to get appointments for the authenticated user (patient or doctor).
 * Validates input, checks auth, and returns appointments.
 * @param data - { statusFilter?: AppointmentStatus, dateFilter?: 'upcoming' | 'past' }
 * @param context - CallableContext
 * @returns Appointment[]
 */
export const getMyAppointments = functions.https.onCall(async (data, context) => {
  return await trackPerformance('getMyAppointments', async () => {
    logInfo('[getMyAppointments] Invoked', { uid: context.auth?.uid, data });
    if (!context.auth?.uid) {
      logError('[getMyAppointments] Unauthenticated request');
      throw new HttpsError('unauthenticated', 'Authentication required');
    }
    const parseResult = GetAppointmentsSchema.safeParse(data);
    if (!parseResult.success) {
      logError('[getMyAppointments] Invalid input', { error: parseResult.error });
      throw new HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { statusFilter, dateFilter } = parseResult.data;
    let userType;
    try {
      userType = await getUserTypeFromAuth(context.auth.uid);
    } catch (err) {
      logError('[getMyAppointments] Failed to get user type', { err });
      throw new HttpsError('not-found', 'User type not found');
    }
    try {
      const appointments = await fetchUserAppointments(context.auth.uid, userType, statusFilter, dateFilter);
      logInfo('[getMyAppointments] Returning appointments', { count: appointments.length });
      return { appointments };
    } catch (error) {
      logError('[getMyAppointments] Unexpected error', { error });
      throw new HttpsError('internal', 'Failed to fetch appointments');
    }
  });
});
