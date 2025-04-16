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
import { Timestamp } from 'firebase/firestore';

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
  specialty: "Cardiology",
  licenseNumber: "DOC-12345",
  yearsOfExperience: 12,
  education: "MD, Harvard Medical School",
  bio: "Experienced cardiologist with a passion for patient care.",
  verificationStatus: VerificationStatus.APPROVED,
  verificationNotes: "All documents validated.",
  location: "New York, NY",
  languages: ["English", "Spanish"],
  consultationFee: 150,
  profilePictureUrl: "https://example.com/profile/doctor1.jpg",
  licenseDocumentUrl: "https://example.com/docs/license1.pdf",
  certificateUrl: "https://example.com/docs/cert1.pdf"
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
  verificationStatus: VerificationStatus.APPROVED,
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
  // Dr. Bob Johnson (mockDoctorUser.id) availability
  {
  id: 'avail_001',
  doctorId: mockDoctorUser.id,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    id: 'avail_002',
    doctorId: mockDoctorUser.id,
    dayOfWeek: 2, // Tuesday
    startTime: '13:00',
    endTime: '17:00',
    isAvailable: true,
  },
  {
    id: 'avail_003',
    doctorId: mockDoctorUser.id,
    dayOfWeek: 4, // Thursday
    startTime: '10:00',
    endTime: '15:00',
    isAvailable: true,
  },
  {
    id: 'avail_004',
    doctorId: 'user_doctor_002', // Dr. Jane Lee
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    id: 'avail_005',
    doctorId: 'user_doctor_002',
    dayOfWeek: 3, // Wednesday
    startTime: '13:00',
    endTime: '18:00',
    isAvailable: true,
  },
  {
    id: 'avail_006',
    doctorId: 'user_doctor_003', // Dr. Emily Carter
    dayOfWeek: 2, // Tuesday
    startTime: '09:00',
    endTime: '13:00',
    isAvailable: true,
  },
  {
    id: 'avail_007',
    doctorId: 'user_doctor_003',
    dayOfWeek: 5, // Friday
    startTime: '10:00',
    endTime: '16:00',
    isAvailable: true,
  },
  // Additional availability slots for more doctors
  {
    id: 'avail_008',
    doctorId: 'user_doctor_004', // Dr. Michael Kim
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '14:00',
    isAvailable: true,
  },
  {
    id: 'avail_009',
    doctorId: 'user_doctor_004',
    dayOfWeek: 3, // Wednesday
    startTime: '13:00',
    endTime: '19:00',
    isAvailable: true,
  },
  {
    id: 'avail_010',
    doctorId: 'user_doctor_005', // Dr. Ana Souza
    dayOfWeek: 0, // Sunday
    startTime: '10:00',
    endTime: '14:00',
    isAvailable: true,
  },
  {
    id: 'avail_011',
    doctorId: 'user_doctor_005',
    dayOfWeek: 4, // Thursday
    startTime: '13:00',
    endTime: '18:00',
    isAvailable: true,
  },
  {
    id: 'avail_012',
    doctorId: 'user_doctor_005',
    dayOfWeek: 6, // Saturday
  startTime: '09:00',
  endTime: '12:00',
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
  uploadedAt: Timestamp.fromDate(new Date('2023-12-02T10:00:00Z'))
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
    appointmentDate: new Date('2024-02-15T00:00:00Z'),
    startTime: '14:00',
    endTime: '14:30',
    status: AppointmentStatus.CANCELLED,
    reason: 'Follow-up for skin rash',
    notes: 'Patient cancelled due to travel.',
    createdAt: new Date('2024-02-01T10:00:00Z'),
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
    appointmentDate: new Date('2024-03-22T00:00:00Z'),
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.COMPLETED,
    reason: 'Annual wellness visit',
    notes: 'Patient reports feeling well. Follow up in 12 months.',
    createdAt: new Date('2024-03-01T10:00:00Z'),
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
    appointmentDate: new Date(),
    startTime: '11:00',
    endTime: '11:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Heart palpitations',
    notes: '',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
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
    appointmentDate: new Date('2024-01-10T00:00:00Z'),
    startTime: '13:30',
    endTime: '14:00',
    status: AppointmentStatus.COMPLETED,
    reason: 'Eczema treatment',
    notes: 'Prescribed steroid cream. Patient responding well to treatment.',
    createdAt: new Date('2023-12-25T10:00:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  // Add more appointments for testing pagination and filtering
  {
    id: 'appt_009',
    patientId: 'user_patient_003',
    patientName: 'Cathy Zhao',
    doctorId: 'user_doctor_003',
    doctorName: 'Dr. Emily Carter',
    doctorSpecialty: mockDoctorProfileData3.specialty,
    appointmentDate: new Date('2024-02-05T00:00:00Z'),
    startTime: '10:00',
    endTime: '10:45',
    status: AppointmentStatus.COMPLETED,
    reason: 'Child vaccination',
    notes: 'Completed scheduled vaccinations. Next appointment in 6 months.',
    createdAt: new Date('2024-01-20T08:30:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_010',
    patientId: 'user_patient_002',
    patientName: 'Brian Davis',
    doctorId: 'user_doctor_005',
    doctorName: 'Dr. Ana Souza',
    doctorSpecialty: mockDoctorProfileData5.specialty,
    appointmentDate: new Date('2025-05-22T00:00:00Z'),
    startTime: '15:30',
    endTime: '16:00',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Recurring headaches',
    notes: '',
    createdAt: new Date('2025-04-15T09:45:00Z'),
    updatedAt: new Date(),
    appointmentType: 'Video',
  },
  {
    id: 'appt_011',
    patientId: mockPatientUser.id,
    patientName: `${mockPatientUser.firstName} ${mockPatientUser.lastName}`,
    doctorId: 'user_doctor_004',
    doctorName: 'Dr. Michael Kim',
    doctorSpecialty: mockDoctorProfileData4.specialty,
    appointmentDate: new Date('2025-06-10T00:00:00Z'),
    startTime: '09:30',
    endTime: '10:15',
    status: AppointmentStatus.PENDING,
    reason: 'Sports injury follow-up',
    notes: '',
    createdAt: new Date('2025-04-30T11:20:00Z'),
    updatedAt: new Date(),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_012',
    patientId: 'user_patient_003',
    patientName: 'Cathy Zhao',
    doctorId: mockDoctorUser.id,
    doctorName: `${mockDoctorUser.firstName} ${mockDoctorUser.lastName}`,
    doctorSpecialty: mockDoctorProfileData1.specialty,
    appointmentDate: new Date('2025-05-30T00:00:00Z'),
    startTime: '14:00',
    endTime: '14:30',
    status: AppointmentStatus.PENDING,
    reason: 'Chest pain evaluation',
    notes: '',
    createdAt: new Date('2025-04-28T16:15:00Z'),
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
  },
  // Additional notifications for testing
  {
    id: 'notif_011',
    userId: 'user_doctor_004',
    title: 'New Appointment',
    message: 'Cathy Zhao has scheduled an appointment with you for May 7, 2025 at 14:00.',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    type: 'appointment',
    relatedId: 'appt_006'
  },
  {
    id: 'notif_012',
    userId: 'user_patient_003',
    title: 'Form Reminder',
    message: 'Please complete your pre-visit questionnaire before your upcoming appointment.',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    type: 'form',
    relatedId: 'form_003'
  },
  {
    id: 'notif_013',
    userId: 'user_doctor_005',
    title: 'Form Submitted',
    message: 'Alice Smith has completed the pre-visit questionnaire for their upcoming appointment.',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    type: 'form',
    relatedId: 'form_003'
  },
  {
    id: 'notif_014',
    userId: 'user_patient_002',
    title: 'Appointment Ready',
    message: 'Your video appointment with Dr. Ana Souza will begin in 15 minutes. Please be ready.',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    type: 'reminder',
    relatedId: 'appt_010'
  },
  {
    id: 'notif_015',
    userId: mockDoctorUser.id,
    title: 'Lab Results',
    message: 'New lab results are available for patient Alice Smith.',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    type: 'results',
    relatedId: 'lab_001'
  }
];

// --- Doctor Forms Mock Data ---
export const mockDoctorForms = [
  {
    id: 'form_001',
    doctorId: mockDoctorUser.id,
    title: 'New Patient Intake Form',
    description: 'Please complete this form before your first appointment.',
    isRequired: true,
    fields: [
      { id: 'field_001', label: 'Full Name', type: 'text', required: true },
      { id: 'field_002', label: 'Date of Birth', type: 'date', required: true },
      { id: 'field_003', label: 'Current Medications', type: 'textarea', required: false },
      { id: 'field_004', label: 'Allergies', type: 'textarea', required: true },
      { id: 'field_005', label: 'Medical History', type: 'textarea', required: true }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_002',
    doctorId: mockDoctorUser.id,
    title: 'Insurance Information',
    description: 'Please provide your current insurance details.',
    isRequired: true,
    fields: [
      { id: 'field_006', label: 'Insurance Provider', type: 'text', required: true },
      { id: 'field_007', label: 'Member ID', type: 'text', required: true },
      { id: 'field_008', label: 'Group Number', type: 'text', required: false },
      { id: 'field_009', label: 'Policy Holder Name', type: 'text', required: true }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_003',
    doctorId: mockDoctorUser.id,
    title: 'Pre-Visit Questionnaire',
    description: 'Help us prepare for your visit by filling out this form.',
    isRequired: false,
    fields: [
      { id: 'field_010', label: 'Reason for Visit', type: 'textarea', required: true },
      { id: 'field_011', label: 'When did symptoms begin?', type: 'date', required: false },
      { id: 'field_012', label: 'Pain Scale (1-10)', type: 'number', required: false },
      { id: 'field_013', label: 'Additional Information', type: 'textarea', required: false }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_004',
    doctorId: 'user_doctor_002',
    title: 'Dermatology Questionnaire',
    description: 'Complete this form for your dermatology consultation.',
    isRequired: true,
    fields: [
      { id: 'field_014', label: 'Skin Condition History', type: 'textarea', required: true },
      { id: 'field_015', label: 'Family History of Skin Disorders', type: 'textarea', required: false },
      { id: 'field_016', label: 'Current Skincare Routine', type: 'textarea', required: true }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_005',
    doctorId: 'user_doctor_003',
    title: 'Pediatric Health History',
    description: 'Please provide information about your child\'s health history.',
    isRequired: true,
    fields: [
      { id: 'field_017', label: 'Child\'s Name', type: 'text', required: true },
      { id: 'field_018', label: 'Date of Birth', type: 'date', required: true },
      { id: 'field_019', label: 'Birth Weight', type: 'text', required: true },
      { id: 'field_020', label: 'Immunization History', type: 'textarea', required: true },
      { id: 'field_021', label: 'Previous Illnesses or Surgeries', type: 'textarea', required: true },
      { id: 'field_022', label: 'Family Medical History', type: 'textarea', required: false }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_006',
    doctorId: 'user_doctor_004',
    title: 'Orthopedic Injury Assessment',
    description: 'Please describe your orthopedic injury or concern.',
    isRequired: true,
    fields: [
      { id: 'field_023', label: 'Injury Type', type: 'select', options: ['Sprain', 'Fracture', 'Strain', 'Chronic Pain', 'Other'], required: true },
      { id: 'field_024', label: 'Date of Injury', type: 'date', required: true },
      { id: 'field_025', label: 'How did the injury occur?', type: 'textarea', required: true },
      { id: 'field_026', label: 'Current Pain Level (1-10)', type: 'number', required: true },
      { id: 'field_027', label: 'Previous Related Injuries', type: 'textarea', required: false }
    ],
    createdAt: new Date()
  },
  {
    id: 'form_007',
    doctorId: 'user_doctor_005',
    title: 'Neurology Symptom Questionnaire',
    description: 'Help us understand your neurological symptoms.',
    isRequired: true,
    fields: [
      { id: 'field_028', label: 'Primary Symptom', type: 'select', options: ['Headache', 'Dizziness', 'Memory Issues', 'Tremors', 'Numbness', 'Other'], required: true },
      { id: 'field_029', label: 'Symptom Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Occasionally'], required: true },
      { id: 'field_030', label: 'Symptom Duration', type: 'select', options: ['Minutes', 'Hours', 'Days', 'Constant'], required: true },
      { id: 'field_031', label: 'Symptom Description', type: 'textarea', required: true },
      { id: 'field_032', label: 'Factors that worsen symptoms', type: 'textarea', required: false },
      { id: 'field_033', label: 'Factors that improve symptoms', type: 'textarea', required: false }
    ],
    createdAt: new Date()
  }
];

// Let's add more detailed doctor profiles
export const mockDoctorProfilesArray: DoctorProfile[] = [
  {
    userId: 'user_doctor_001',
    specialty: 'Family Medicine',
    licenseNumber: 'FM123456',
    yearsOfExperience: 8,
    education: 'MD, University of Washington; Family Medicine Residency, UCLA Medical Center',
    bio: 'Dr. Bob Johnson is a board-certified family physician with a passion for preventive care and patient education. He believes in a holistic approach to health, considering both physical and mental wellbeing.',
    languages: ['English', 'Spanish'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Seattle, WA',
    consultationFee: 150,
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    licenseDocumentUrl: 'https://example.com/docs/license1.pdf',
    certificateUrl: 'https://example.com/docs/cert1.pdf'
  },
  {
    userId: 'user_doctor_002',
    specialty: 'Dermatology',
    licenseNumber: 'DERM789012',
    yearsOfExperience: 10,
    education: 'MD, Harvard Medical School',
    bio: 'Dr. Jane Lee is a board-certified dermatologist specializing in both medical and cosmetic dermatology. She has a particular interest in skin cancer prevention and treatment of chronic skin conditions.',
    languages: ['English', 'Korean'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Boston, MA',
    consultationFee: 200,
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  },
  {
    userId: 'user_doctor_003',
    specialty: 'Pediatrics',
    licenseNumber: 'PED567890',
    yearsOfExperience: 12,
    education: 'MD, Johns Hopkins University',
    bio: 'Dr. Emily Carter is a compassionate pediatrician dedicated to providing comprehensive care for children from infancy through adolescence. She emphasizes developmental milestones, preventive care, and strong parent-physician communication.',
    languages: ['English', 'French'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Philadelphia, PA',
    consultationFee: 175,
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    licenseDocumentUrl: 'https://example.com/docs/license3.pdf',
    certificateUrl: 'https://example.com/docs/cert3.pdf',
  },
  {
    userId: 'user_doctor_004',
    specialty: 'Orthopedic Surgery',
    licenseNumber: 'ORTH12345',
    yearsOfExperience: 15,
    education: 'MD, Mayo Clinic Alix School of Medicine',
    bio: 'Dr. Michael Kim is a board-certified orthopedic surgeon specializing in sports medicine and joint replacement surgery. With over 15 years of experience, he has helped numerous professional athletes and weekend warriors recover from injuries and return to their activities.',
    languages: ['English', 'Korean'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Boston, MA',
    consultationFee: 200,
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  },
  {
    userId: 'user_doctor_005',
    specialty: 'Neurology',
    licenseNumber: 'NEUR54321',
    yearsOfExperience: 12,
    education: 'MD, Harvard Medical School',
    bio: 'Dr. Ana Souza is a board-certified neurologist with a special interest in headache disorders, epilepsy, and neurodegenerative diseases. She takes a comprehensive approach to neurological care, focusing on both medical management and lifestyle modifications.',
    languages: ['English', 'Portuguese', 'Spanish'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Boston, MA',
    consultationFee: 225,
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  },
  {
    userId: 'user_doctor_006',
    specialty: 'Psychiatry',
    licenseNumber: 'PSYC78901',
    yearsOfExperience: 10,
    education: 'MD, Yale University School of Medicine',
    bio: 'Dr. David Patel is a compassionate psychiatrist who specializes in mood disorders, anxiety, and addiction medicine. He integrates evidence-based pharmacology with psychotherapy for a holistic approach to mental health care.',
    languages: ['English', 'Hindi', 'Gujarati'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Cambridge, MA',
    consultationFee: 180,
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  },
  {
    userId: 'user_doctor_007',
    specialty: 'Cardiology',
    licenseNumber: 'CARD24680',
    yearsOfExperience: 18,
    education: 'MD, Duke University School of Medicine',
    bio: 'Dr. Sarah Williams is a highly experienced cardiologist specializing in interventional procedures and preventive cardiology. She is passionate about heart disease prevention and helping patients maintain optimal cardiovascular health through lifestyle modifications and appropriate medical interventions.',
    languages: ['English', 'French'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Boston, MA',
    consultationFee: 250,
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/31.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  },
  {
    userId: 'user_doctor_008',
    specialty: 'Endocrinology',
    licenseNumber: 'ENDO13579',
    yearsOfExperience: 9,
    education: 'MD, University of California, San Francisco',
    bio: 'Dr. James Chen is an endocrinologist focusing on diabetes management, thyroid disorders, and hormonal imbalances. He is known for his patient-centered approach and expertise in the latest diabetes technologies and treatments.',
    languages: ['English', 'Mandarin'],
    verificationStatus: VerificationStatus.APPROVED,
    location: 'Brookline, MA',
    consultationFee: 190,
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/55.jpg',
    licenseDocumentUrl: null,
    certificateUrl: null,
  }
];

// Additional user data for new doctors
export const mockDoctorUser4: UserProfile = {
  id: 'user_doctor_004',
  email: 'michael.kim@example.com',
  firstName: 'Michael',
  lastName: 'Kim',
  phone: '+15556789012',
  userType: UserType.DOCTOR,
  createdAt: new Date('2023-04-15'),
  updatedAt: new Date(),
  isActive: true,
  emailVerified: true,
  phoneVerified: true
};

export const mockDoctorUser5: UserProfile = {
  id: 'user_doctor_005',
  email: 'ana.souza@example.com',
  firstName: 'Ana',
  lastName: 'Souza',
  phone: '+15551234567',
  userType: UserType.DOCTOR,
  createdAt: new Date('2023-05-20'),
  updatedAt: new Date(),
  isActive: true,
  emailVerified: true,
  phoneVerified: true
};

export const mockDoctorUser6: UserProfile = {
  id: 'user_doctor_006',
  email: 'david.patel@example.com',
  firstName: 'David',
  lastName: 'Patel',
  phone: '+15559876543',
  userType: UserType.DOCTOR,
  createdAt: new Date('2023-06-10'),
  updatedAt: new Date(),
  isActive: true,
  emailVerified: true,
  phoneVerified: true
};

export const mockDoctorUser7: UserProfile = {
  id: 'user_doctor_007',
  email: 'sarah.williams@example.com',
  firstName: 'Sarah',
  lastName: 'Williams',
  phone: '+15552468024',
  userType: UserType.DOCTOR,
  createdAt: new Date('2023-03-05'),
  updatedAt: new Date(),
  isActive: true,
  emailVerified: true,
  phoneVerified: true
};

export const mockDoctorUser8: UserProfile = {
  id: 'user_doctor_008',
  email: 'james.chen@example.com',
  firstName: 'James',
  lastName: 'Chen',
  phone: '+15551357913',
  userType: UserType.DOCTOR,
  createdAt: new Date('2023-07-15'),
  updatedAt: new Date(),
  isActive: true,
  emailVerified: true,
  phoneVerified: true
};

// Define missing user profiles
export const mockDoctorUser2: UserProfile = {
  id: 'user_doctor_002',
  email: 'jane.lee@example.com',
  phone: '+1234567892',
  firstName: 'Jane',
  lastName: 'Lee',
  userType: UserType.DOCTOR,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: new Date('2023-11-15T08:00:00Z'),
  updatedAt: new Date(),
};

export const mockDoctorUser3: UserProfile = {
  id: 'user_doctor_003',
  email: 'emily.carter@example.com',
  phone: '+1234567893',
  firstName: 'Emily',
  lastName: 'Carter',
  userType: UserType.DOCTOR,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: new Date('2023-10-20T08:00:00Z'),
  updatedAt: new Date(),
};

// Add all doctor users to the array
export const mockDoctorUsersArray: UserProfile[] = [
  mockDoctorUser,
  mockDoctorUser2,
  mockDoctorUser3,
  mockDoctorUser4,
  mockDoctorUser5,
  mockDoctorUser6,
  mockDoctorUser7,
  mockDoctorUser8
];
