/**
 * Mock data generators for all core types.
 * Provides realistic sample data for UI population and Firestore seeding.
 */
import { Timestamp } from 'firebase/firestore';
import { UserType, VerificationStatus, AppointmentStatus } from './enums';
import type { UserProfile } from './user';
import type { PatientProfile } from './patient';
import type { DoctorProfile, DoctorAvailabilitySlot, VerificationDocument } from './doctor';
import type { Appointment } from './appointment';
import type { Notification } from './notification';

// --- User Mocks ---
export const mockPatientUser: UserProfile = {
  id: 'user_patient_001',
  email: 'patient1@example.com',
  phone: '+1234567890',
  firstName: 'Alice',
  lastName: 'Smith',
  userType: UserType.PATIENT,
  isActive: true,
  emailVerified: true,
  phoneVerified: false,
  createdAt: Timestamp.fromDate(new Date('2024-01-10T10:00:00Z')),
  updatedAt: Timestamp.now(),
};

export const mockDoctorUser: UserProfile = {
  id: 'user_doctor_001',
  email: 'doctor1@example.com',
  phone: '+1234567891',
  firstName: 'Dr. Bob',
  lastName: 'Johnson',
  userType: UserType.DOCTOR,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: Timestamp.fromDate(new Date('2023-12-01T09:00:00Z')),
  updatedAt: Timestamp.now(),
};

export const mockAdminUser: UserProfile = {
  id: 'user_admin_001',
  email: 'admin@example.com',
  phone: null,
  firstName: 'Admin',
  lastName: 'User',
  userType: UserType.ADMIN,
  isActive: true,
  emailVerified: true,
  phoneVerified: false,
  createdAt: Timestamp.fromDate(new Date('2023-11-01T08:00:00Z')),
  updatedAt: Timestamp.now(),
};

// --- Patient Profile Mock ---
export const mockPatientProfileData: PatientProfile = {
  userId: mockPatientUser.id,
  dateOfBirth: Timestamp.fromDate(new Date('1990-05-15T00:00:00Z')),
  gender: 'Female',
  bloodType: 'A+',
  medicalHistory: 'Asthma, mild seasonal allergies.',
};

// --- Doctor Profile Mocks ---
export const mockDoctorProfileData1: DoctorProfile = {
  userId: mockDoctorUser.id,
  specialty: 'Cardiology',
  licenseNumber: 'DOC-12345',
  yearsOfExperience: 12,
  education: 'MD, Harvard Medical School',
  bio: 'Experienced cardiologist with a passion for patient care.',
  verificationStatus: VerificationStatus.VERIFIED,
  verificationNotes: 'All documents validated.',
  location: 'New York, NY',
  languages: ['English', 'Spanish'],
  consultationFee: 150,
  profilePictureUrl: 'https://example.com/profile/doctor1.jpg',
  licenseDocumentUrl: 'https://example.com/docs/license1.pdf',
  certificateUrl: 'https://example.com/docs/cert1.pdf',
};

export const mockDoctorProfileData2: DoctorProfile = {
  userId: 'user_doctor_002',
  specialty: 'Dermatology',
  licenseNumber: 'DOC-67890',
  yearsOfExperience: 8,
  education: 'MD, Stanford University',
  bio: 'Dermatologist specializing in skin cancer prevention.',
  verificationStatus: VerificationStatus.PENDING,
  location: 'San Francisco, CA',
  languages: ['English', 'Mandarin'],
  consultationFee: 120,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
};

export const mockDoctorProfileData3: DoctorProfile = {
  userId: 'user_doctor_003',
  specialty: 'Pediatrics',
  licenseNumber: 'DOC-54321',
  yearsOfExperience: 15,
  education: 'MD, Johns Hopkins University',
  bio: 'Pediatrician dedicated to children’s health and wellness.',
  verificationStatus: VerificationStatus.VERIFIED,
  verificationNotes: 'All documents validated.',
  location: 'Chicago, IL',
  languages: ['English', 'French'],
  consultationFee: 100,
  profilePictureUrl: 'https://example.com/profile/doctor3.jpg',
  licenseDocumentUrl: 'https://example.com/docs/license3.pdf',
  certificateUrl: 'https://example.com/docs/cert3.pdf',
};

export const mockDoctorProfileData4: DoctorProfile = {
  userId: 'user_doctor_004',
  specialty: 'Orthopedics',
  licenseNumber: 'DOC-98765',
  yearsOfExperience: 20,
  education: 'MD, Mayo Clinic Alix School of Medicine',
  bio: 'Orthopedic surgeon with a focus on sports injuries.',
  verificationStatus: VerificationStatus.PENDING,
  verificationNotes: '',
  location: 'Houston, TX',
  languages: ['English', 'Spanish'],
  consultationFee: 200,
  profilePictureUrl: 'https://example.com/profile/doctor4.jpg',
  licenseDocumentUrl: null,
  certificateUrl: null,
};

export const mockDoctorProfileData5: DoctorProfile = {
  userId: 'user_doctor_005',
  specialty: 'Neurology',
  licenseNumber: 'DOC-11223',
  yearsOfExperience: 10,
  education: 'MD, Columbia University',
  bio: 'Neurologist passionate about brain health and research.',
  verificationStatus: VerificationStatus.UNVERIFIED,
  verificationNotes: 'Pending license review.',
  location: 'Miami, FL',
  languages: ['English', 'Portuguese'],
  consultationFee: 180,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
};

// --- Doctor Availability Slot Mock ---
export const mockDoctorAvailabilitySlot: DoctorAvailabilitySlot = {
  id: 'avail_001',
  doctorId: mockDoctorUser.id,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '12:00',
  isAvailable: true,
};

// --- Verification Document Mock ---
export const mockVerificationDocument: VerificationDocument = {
  id: 'doc_001',
  doctorId: mockDoctorUser.id,
  documentType: 'License',
  fileUrl: 'https://example.com/docs/license1.pdf',
  uploadedAt: Timestamp.fromDate(new Date('2023-12-02T10:00:00Z')),
};

// --- Appointments Mock Array ---
export const mockAppointmentsArray: Appointment[] = [
  {
    id: 'appt_001',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: mockDoctorUser.id,
    doctorName: `${mockDoctorUser.firstName} ${mockDoctorUser.lastName}`,
    doctorSpecialty: mockDoctorProfileData1.specialty,
    appointmentDate: Timestamp.fromDate(new Date('2025-05-01T00:00:00Z')),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Routine check-up',
    notes: 'Patient is in good health.',
    createdAt: Timestamp.fromDate(new Date('2025-04-01T10:00:00Z')),
    updatedAt: Timestamp.now(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_002',
    patientId: mockPatientUser.id,
    doctorId: mockDoctorUser.id,
    appointmentDate: Timestamp.fromDate(new Date('2025-05-10T00:00:00Z')),
    startTime: '11:00',
    endTime: '11:30',
    status: AppointmentStatus.PENDING,
    reason: 'Consultation for chest pain',
    notes: '',
    createdAt: Timestamp.fromDate(new Date('2025-04-10T09:00:00Z')),
    updatedAt: Timestamp.now(),
    appointmentType: 'Video',
  },
  {
    id: 'appt_003',
    patientId: mockPatientUser.id,
    doctorId: 'user_doctor_002',
    doctorSpecialty: mockDoctorProfileData2.specialty,
    appointmentDate: Timestamp.fromDate(new Date('2025-06-01T00:00:00Z')),
    startTime: '14:00',
    endTime: '14:30',
    status: AppointmentStatus.CANCELLED,
    reason: 'Follow-up for skin rash',
    notes: 'Patient cancelled due to travel.',
    createdAt: Timestamp.fromDate(new Date('2025-05-01T10:00:00Z')),
    updatedAt: Timestamp.now(),
    appointmentType: 'In-person',
  },
];

// --- Notifications Mock Array ---
export const mockNotificationsArray: Notification[] = [
  {
    id: 'notif_001',
    userId: mockPatientUser.id,
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Bob Johnson is confirmed for May 1, 2025 at 10:00.',
    isRead: false,
    createdAt: Timestamp.now(),
    type: 'appointment_booked',
    relatedId: 'appt_001',
  },
  {
    id: 'notif_002',
    userId: mockDoctorUser.id,
    title: 'New Appointment Request',
    message: 'You have a new appointment request from Alice Smith.',
    isRead: false,
    createdAt: Timestamp.now(),
    type: 'appointment_booked',
    relatedId: 'appt_002',
  },
  {
    id: 'notif_003',
    userId: mockDoctorUser.id,
    title: 'Verification Approved',
    message: 'Your account has been verified by the admin.',
    isRead: true,
    createdAt: Timestamp.fromDate(new Date('2024-01-01T08:00:00Z')),
    type: 'verification_approved',
    relatedId: null,
  },
];
