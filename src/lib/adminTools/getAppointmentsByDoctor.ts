import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Returns all appointments for a given doctorId, with a readable log output.
 */
export async function getAppointmentsByDoctor(doctorId: string): Promise<string> {
  if (!doctorId) return 'No doctorId provided.';
  try {
    const snap = await db.collection('appointments').where('doctorId', '==', doctorId).get();
    if (snap.empty) return `No appointments found for doctorId: ${doctorId}`;
    const logs: string[] = [];
    snap.forEach(doc => {
      const appt = doc.data();
      logs.push(`AppointmentId: ${doc.id}, patientId: ${appt.patientId || ''}, date: ${appt.appointmentDate || ''}, status: ${appt.status || ''}`);
    });
    return logs.join('\n');
  } catch (e: any) {
    return `[ERROR] ${e.message || 'Failed to fetch appointments.'}`;
  }
}
