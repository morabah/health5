/**
 * Defines core enumeration types used throughout the application.
 *
 * These enums provide type-safe status values for user roles, doctor verification, and appointment lifecycle management.
 */

/**
 * Enumerates the core user roles in the system.
 * - PATIENT: End user booking appointments.
 * - DOCTOR: Medical professional providing services.
 * - ADMIN: System administrator with elevated privileges.
 */
export enum UserType {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

/**
 * Enumerates possible verification states for doctors.
 * - PENDING: Awaiting review by admin.
 * - VERIFIED: Approved and can provide services.
 * - REJECTED: Application denied by admin.
 */
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MORE_INFO_REQUIRED = 'more_info_required'
}

/**
 * Enumerates the lifecycle states of an appointment.
 * - PENDING: Awaiting confirmation by doctor.
 * - CONFIRMED: Accepted by doctor and scheduled.
 * - SCHEDULED: Confirmed and added to calendar.
 * - CANCELLED: Cancelled without specifying which party cancelled.
 * - CANCELLED_BY_PATIENT: Explicitly cancelled by patient.
 * - CANCELLED_BY_DOCTOR: Explicitly cancelled by doctor.
 * - COMPLETED: Appointment has taken place and is finished.
 * - NO_SHOW: Patient did not attend the scheduled appointment.
 * - RESCHEDULED: Appointment has been rescheduled to a new time.
 */
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  CANCELLED_BY_PATIENT = 'CANCELLED_BY_PATIENT',
  CANCELLED_BY_DOCTOR = 'CANCELLED_BY_DOCTOR',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}
