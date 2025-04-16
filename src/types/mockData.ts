/**
 * Mock data generators for all core types.
 * Provides realistic sample data for UI population and Firestore seeding.
 */
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
  createdAt: new Date('2024-01-10T10:00:00Z'),
  updatedAt: new Date(),
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
  createdAt: new Date('2023-12-01T09:00:00Z'),
  updatedAt: new Date(),
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
  createdAt: new Date('2023-11-01T08:00:00Z'),
  updatedAt: new Date(),
};

// --- Patient Profile Mocks ---
export const mockPatientProfileData1: PatientProfile = {
  userId: mockPatientUser.id,
  dateOfBirth: new Date('1990-05-15T00:00:00Z'),
  gender: 'Female',
  bloodType: 'A+',
  medicalHistory: 'Asthma, mild seasonal allergies.',
};

export const mockPatientProfileData2: PatientProfile = {
  userId: 'user_patient_002',
  dateOfBirth: new Date('1985-03-22T00:00:00Z'),
  gender: 'Male',
  bloodType: 'O-',
  medicalHistory: 'Diabetes Type 2.',
};

export const mockPatientProfileData3: PatientProfile = {
  userId: 'user_patient_003',
  dateOfBirth: new Date('2000-09-10T00:00:00Z'),
  gender: 'Other',
  bloodType: 'B+',
  medicalHistory: 'Hypertension.',
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
  bio: 'Pediatrician dedicated to children\'s health and wellness.',
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
  yearsOfExperience: 12,
  education: 'MD, Harvard Medical School',
  bio: 'Neurologist passionate about brain health and research.',
  verificationStatus: VerificationStatus.PENDING,
  verificationNotes: 'Pending license review.',
  location: 'Miami, FL',
  languages: ['English', 'Portuguese'],
  consultationFee: 180,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
};

export const mockDoctorProfiles: DoctorProfile[] = [
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorProfileData3,
  mockDoctorProfileData4,
  mockDoctorProfileData5,
];

// --- Doctor Availability Slot Mock ---
export const mockDoctorAvailabilitySlots: DoctorAvailabilitySlot[] = [
  {
    id: 'avail_001',
    doctorId: mockDoctorUser.id,
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    id: 'avail_002',
    doctorId: mockDoctorUser.id,
    dayOfWeek: 2,
    startTime: '13:00',
    endTime: '17:00',
    isAvailable: true,
  },
  {
    id: 'avail_003',
    doctorId: mockDoctorUser.id,
    dayOfWeek: 4,
    startTime: '10:00',
    endTime: '15:00',
    isAvailable: true,
  },
  {
    id: 'avail_004',
    doctorId: 'user_doctor_002',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    id: 'avail_005',
    doctorId: 'user_doctor_002',
    dayOfWeek: 3,
    startTime: '13:00',
    endTime: '18:00',
    isAvailable: true,
  },
  {
    id: 'avail_006',
    doctorId: 'user_doctor_003',
    dayOfWeek: 2,
    startTime: '09:00',
    endTime: '13:00',
    isAvailable: true,
  },
  {
    id: 'avail_007',
    doctorId: 'user_doctor_003',
    dayOfWeek: 5,
    startTime: '10:00',
    endTime: '16:00',
    isAvailable: true,
  }
];

export const mockDoctorAvailabilitySlot = mockDoctorAvailabilitySlots[0];

// --- Verification Document Mock ---
export const mockVerificationDocument: VerificationDocument = {
  id: 'doc_001',
  doctorId: mockDoctorUser.id,
  documentType: 'License',
  fileUrl: 'https://example.com/docs/license1.pdf',
  uploadedAt: new Date('2023-12-02T10:00:00Z'),
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
    appointmentDate: new Date('2025-05-01T00:00:00Z'),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Routine check-up',
    notes: 'Patient is in good health.',
    createdAt: new Date('2025-04-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_002',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: mockDoctorUser.id,
    doctorName: `${mockDoctorUser.firstName} ${mockDoctorUser.lastName}`,
    doctorSpecialty: mockDoctorProfileData1.specialty,
    appointmentDate: new Date('2025-05-10T00:00:00Z'),
    startTime: '11:00',
    endTime: '11:30',
    status: AppointmentStatus.PENDING,
    reason: 'Consultation for chest pain',
    notes: '',
    createdAt: new Date('2025-04-10T09:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'Video',
  },
  {
    id: 'appt_003',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: 'user_doctor_002',
    doctorName: 'Dr. Jane Lee',
    doctorSpecialty: mockDoctorProfileData2.specialty,
    appointmentDate: new Date('2025-06-01T00:00:00Z'),
    startTime: '14:00',
    endTime: '14:30',
    status: AppointmentStatus.CANCELLED,
    reason: 'Follow-up for skin rash',
    notes: 'Patient cancelled due to travel.',
    createdAt: new Date('2025-05-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  // Additional appointments
  {
    id: 'appt_004',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: 'user_doctor_003',
    doctorName: 'Dr. Emily Carter',
    doctorSpecialty: mockDoctorProfileData3.specialty,
    appointmentDate: new Date('2025-04-22T00:00:00Z'), // Past appointment
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.COMPLETED,
    reason: 'Annual wellness visit',
    notes: 'Patient reports feeling well. Follow up in 12 months.',
    createdAt: new Date('2025-04-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_005',
    patientId: 'user_patient_002',
    patientName: 'Brian Davis',
    doctorId: mockDoctorUser.id,
    doctorName: `${mockDoctorUser.firstName} ${mockDoctorUser.lastName}`,
    doctorSpecialty: mockDoctorProfileData1.specialty,
    appointmentDate: new Date('2025-04-25T00:00:00Z'), // Today's appointment
    startTime: '11:00',
    endTime: '11:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Heart palpitations',
    notes: '',
    createdAt: new Date('2025-04-01T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'Video',
  },
  {
    id: 'appt_006',
    patientId: 'user_patient_003',
    patientName: 'Cathy Zhao',
    doctorId: 'user_doctor_004',
    doctorName: 'Dr. Michael Kim',
    doctorSpecialty: mockDoctorProfileData4.specialty,
    appointmentDate: new Date('2025-05-07T00:00:00Z'),
    startTime: '14:00',
    endTime: '15:00',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Knee surgery consultation',
    notes: '',
    createdAt: new Date('2025-04-15T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_007',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: 'user_doctor_005',
    doctorName: 'Dr. Ana Souza',
    doctorSpecialty: mockDoctorProfileData5.specialty,
    appointmentDate: new Date('2025-05-15T00:00:00Z'),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Migraine follow-up',
    notes: '',
    createdAt: new Date('2025-04-20T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'Video',
  },
  {
    id: 'appt_008',
    patientId: 'user_patient_002',
    patientName: 'Brian Davis',
    doctorId: 'user_doctor_002',
    doctorName: 'Dr. Jane Lee',
    doctorSpecialty: mockDoctorProfileData2.specialty,
    appointmentDate: new Date('2025-04-10T00:00:00Z'), // Past appointment
    startTime: '13:30',
    endTime: '14:00',
    status: AppointmentStatus.COMPLETED,
    reason: 'Eczema treatment',
    notes: 'Prescribed steroid cream. Patient responding well to treatment.',
    createdAt: new Date('2025-03-25T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  }
];

// --- Notifications Mock Array ---
export const mockNotificationsArray: Notification[] = [
  {
    id: 'notif_001',
    userId: mockPatientUser.id,
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Bob Johnson is confirmed for May 1, 2025 at 10:00.',
    isRead: false,
    createdAt: new Date(),
    type: 'appointment',
    relatedId: 'appt_001'
  },
  {
    id: 'notif_002',
    userId: mockPatientUser.id,
    title: 'New Message',
    message: 'Dr. Bob Johnson has sent you a message regarding your upcoming appointment.',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    type: 'message',
    relatedId: 'msg_001'
  },
  {
    id: 'notif_003',
    userId: mockDoctorUser.id,
    title: 'New Appointment Request',
    message: 'Alice Smith has requested an appointment on May 10, 2025 at 11:00.',
    isRead: false,
    createdAt: new Date(),
    type: 'appointment',
    relatedId: 'appt_002'
  },
  {
    id: 'notif_004',
    userId: mockPatientUser.id,
    title: 'Appointment Reminder',
    message: 'Reminder: You have an appointment with Dr. Bob Johnson tomorrow at 10:00.',
    isRead: false,
    createdAt: new Date(),
    type: 'reminder',
    relatedId: 'appt_001'
  },
  {
    id: 'notif_005',
    userId: mockDoctorUser.id,
    title: 'Patient Cancelled',
    message: 'Alice Smith has cancelled their appointment scheduled for June 1, 2025.',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    type: 'cancellation',
    relatedId: 'appt_003'
  },
  {
    id: 'notif_006',
    userId: 'user_patient_002',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Bob Johnson is confirmed for April 25, 2025 at 11:00.',
    isRead: false,
    createdAt: new Date(),
    type: 'appointment',
    relatedId: 'appt_005'
  },
  {
    id: 'notif_007',
    userId: 'user_doctor_002',
    title: 'New Patient',
    message: 'Alice Smith has booked their first appointment with you.',
    isRead: false,
    createdAt: new Date(),
    type: 'system',
    relatedId: null
  },
  {
    id: 'notif_008',
    userId: mockPatientUser.id,
    title: 'Prescription Ready',
    message: 'Your prescription is ready for pickup at your preferred pharmacy.',
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    type: 'prescription',
    relatedId: 'rx_001'
  },
  {
    id: 'notif_009',
    userId: 'user_doctor_003',
    title: 'Completed Appointment',
    message: 'Your appointment with Alice Smith has been marked as completed.',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    type: 'appointment',
    relatedId: 'appt_004'
  },
  {
    id: 'notif_010',
    userId: mockPatientUser.id,
    title: 'Payment Processed',
    message: 'Your payment of $150 for the appointment with Dr. Bob Johnson has been processed.',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    type: 'payment',
    relatedId: 'pay_001'
  }
];
