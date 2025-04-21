/**
 * Backend-local enums for appointment and user types.
 * Only include those required by backend functions.
 */

export enum UserType {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  CANCELLED_BY_PATIENT = 'CANCELLED_BY_PATIENT',
  CANCELLED_BY_DOCTOR = 'CANCELLED_BY_DOCTOR',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}
