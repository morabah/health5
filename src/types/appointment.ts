/**
 * Represents an appointment booked between a patient and a doctor.
 */
import { AppointmentStatus } from './enums';
import { Timestamp } from 'firebase/firestore';

/**
 * Appointment defines the structure for appointment records in Firestore.
 */
export interface Appointment {
  /** Optional unique identifier for the appointment (Firestore doc ID). */
  id?: string;
  /** Foreign Key matching the patient user (UserProfile.id). */
  patientId: string;
  /** Denormalized patient name for quick lookup (optional). */
  patientName?: string;
  /** Foreign Key matching the doctor user (UserProfile.id). */
  doctorId: string;
  /** Denormalized doctor name for quick lookup (optional). */
  doctorName?: string;
  /** Denormalized doctor specialty for quick lookup (optional). */
  doctorSpecialty?: string;
  /** Date of the appointment (date only, no time component). */
  appointmentDate: Timestamp;
  /** Start time of the appointment in 24-hour format (e.g., "09:00"). */
  startTime: string;
  /** End time of the appointment in 24-hour format (e.g., "09:30"). */
  endTime: string;
  /** Current status of the appointment. */
  status: AppointmentStatus;
  /** @PHI Reason for the appointment as provided by the patient. */
  reason: string;
  /** @PHI Additional notes regarding the appointment (e.g., outcome, doctor notes). */
  notes: string;
  /** Timestamp of when the appointment was created. */
  createdAt: Timestamp;
  /** Timestamp of the last update to the appointment. */
  updatedAt: Timestamp;
  /** Type of appointment (e.g., 'In-person', 'Video'). Optional. */
  appointmentType?: 'In-person' | 'Video';
}
