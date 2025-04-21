/**
 * Centralized export for all data loading functions.
 * This makes importing data loaders more consistent across the application.
 */

// Doctor-related loaders
export { loadDoctorProfile } from './loadDoctorProfile';
export { loadDoctorAvailability } from './loadDoctorAvailability';

// Patient-related loaders
export { loadPatientProfile } from './loadPatientProfile';

// Appointment-related loaders
export { loadAppointments, createAppointment } from './loadAppointments'; 