/**
 * In-memory mock data store for simulating backend state.
 * Mutable stores for all core types. Use exported accessors to get copies for safe mutation/testing.
 */
import { UserType, VerificationStatus, AppointmentStatus } from "@/types/enums";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile } from "@/types/doctor";
import type { PatientProfile } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Notification } from "@/types/notification";
import {
  mockPatientUser,
  mockDoctorUser,
  mockAdminUser,
  mockPatientProfileData1,
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorProfileData3,
  mockDoctorProfileData4,
  mockDoctorProfileData5,
  mockAppointmentsArray,
  mockNotificationsArray,
} from "@/types/mockData";

/** Users store (all user profiles) */
export let usersStore: UserProfile[] = [mockPatientUser, mockDoctorUser, mockAdminUser,
  // Additional mock users for demo
  {
    id: 'user_doctor_002',
    email: 'doctor2@example.com',
    phone: '+1234567892',
    firstName: 'Dr. Carol',
    lastName: 'Lee',
    userType: UserType.DOCTOR,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date('2023-12-05T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    id: 'user_doctor_003',
    email: 'doctor3@example.com',
    phone: '+1234567893',
    firstName: 'Dr. David',
    lastName: 'Nguyen',
    userType: UserType.DOCTOR,
    isActive: false,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-12-10T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    id: 'user_doctor_004',
    email: 'doctor4@example.com',
    phone: '+1234567894',
    firstName: 'Dr. Eva',
    lastName: 'Martinez',
    userType: UserType.DOCTOR,
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date('2023-12-15T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    id: 'user_doctor_005',
    email: 'doctor5@example.com',
    phone: '+1234567895',
    firstName: 'Dr. Frank',
    lastName: 'Olsen',
    userType: UserType.DOCTOR,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date('2023-12-20T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    id: 'user_patient_002',
    email: 'patient2@example.com',
    phone: '+1234567896',
    firstName: 'Brian',
    lastName: 'Davis',
    userType: UserType.PATIENT,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-02-01T10:00:00Z'),
    updatedAt: new Date(),
  },
  {
    id: 'user_patient_003',
    email: 'patient3@example.com',
    phone: '+1234567897',
    firstName: 'Cathy',
    lastName: 'Zhao',
    userType: UserType.PATIENT,
    isActive: false,
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date('2024-03-01T10:00:00Z'),
    updatedAt: new Date(),
  },
];
/** Doctor profiles store */
export let doctorProfilesStore: DoctorProfile[] = [
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorProfileData3,
  mockDoctorProfileData4,
  mockDoctorProfileData5,
];
/** Patient profiles store */
export let patientProfilesStore: PatientProfile[] = [mockPatientProfileData1, {
  userId: 'user_patient_002',
  dateOfBirth: new Date('1982-09-20T00:00:00Z'),
  gender: 'Male',
  bloodType: 'B-',
  medicalHistory: 'Hypertension.',
}, {
  userId: 'user_patient_003',
  dateOfBirth: new Date('2000-12-11T00:00:00Z'),
  gender: 'Female',
  bloodType: 'O+',
  medicalHistory: 'No known conditions.',
}];
/** Appointments store */
export let appointmentsStore: Appointment[] = [
  ...mockAppointmentsArray,
  // More varied appointments
  {
    id: 'appt_004',
    patientId: 'user_patient_002',
    patientName: 'Brian Davis',
    doctorId: 'user_doctor_003',
    doctorName: 'Dr. David Nguyen',
    doctorSpecialty: 'Pediatrics',
    appointmentDate: new Date('2025-07-01T00:00:00Z'),
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.COMPLETED,
    reason: 'Child wellness check',
    notes: 'All good.',
    createdAt: new Date('2025-06-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_005',
    patientId: 'user_patient_003',
    patientName: 'Cathy Zhao',
    doctorId: 'user_doctor_004',
    doctorName: 'Dr. Eva Martinez',
    doctorSpecialty: 'Orthopedics',
    appointmentDate: new Date('2025-08-01T00:00:00Z'),
    startTime: '15:00',
    endTime: '15:30',
    status: AppointmentStatus.PENDING,
    reason: 'Knee pain',
    notes: '',
    createdAt: new Date('2025-07-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'Video',
  },
];
/** Notifications store */
export let notificationsStore: Notification[] = [
  ...mockNotificationsArray,
  // Add more recent test notifications for patient_001 (who is logged in for testing)
  {
    id: 'notif_test_001',
    userId: 'user_patient_001',
    title: 'Welcome to Health Appointments',
    message: 'Thank you for joining our platform. We\'re here to help you manage your healthcare needs effectively.',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    type: 'system',
    relatedId: null
  },
  {
    id: 'notif_test_002',
    userId: 'user_patient_001',
    title: 'Doctor Available',
    message: 'Dr. Emily Carter has new appointment slots available for next week.',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    type: 'availability',
    relatedId: 'user_doctor_003'
  },
  {
    id: 'notif_test_003',
    userId: 'user_patient_001',
    title: 'Appointment Change',
    message: 'Your appointment with Dr. Michael Kim has been rescheduled to May 12, 2025 at 2:00 PM.',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    type: 'appointment',
    relatedId: 'appt_006'
  },
  {
    id: 'notif_test_004',
    userId: 'user_patient_001',
    title: 'Health Tip',
    message: 'Remember to stay hydrated and get at least 30 minutes of exercise daily for optimal heart health.',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    type: 'system',
    relatedId: null
  },
  {
    id: 'notif_test_005',
    userId: 'user_patient_001',
    title: 'Insurance Update Required',
    message: 'Please update your insurance information before your next appointment.',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    type: 'form',
    relatedId: 'form_002'
  }
];

/**
 * Returns a copy of the users store.
 */
export function getUsersStore(): UserProfile[] {
  return [...usersStore];
}
/**
 * Returns a copy of the doctor profiles store.
 */
export function getDoctorProfilesStore(): DoctorProfile[] {
  return [...doctorProfilesStore];
}
/**
 * Returns a copy of the patient profiles store.
 */
export function getPatientProfilesStore(): PatientProfile[] {
  return [...patientProfilesStore];
}
/**
 * Returns a copy of the appointments store.
 */
export function getAppointmentsStore(): Appointment[] {
  return [...appointmentsStore];
}
/**
 * Returns a copy of the notifications store.
 */
export function getNotificationsStore(): Notification[] {
  return [...notificationsStore];
}

/**
 * Clears all mock data stores (for test resets or login switching)
 */
export function clearAllStores() {
  usersStore = [];
  doctorProfilesStore = [];
  patientProfilesStore = [];
  appointmentsStore = [];
  notificationsStore = [];
}
