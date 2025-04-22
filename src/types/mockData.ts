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
  id: '45979614-7c03-4630-a5f2-8aff9be32f97',
  email: 'doctor1@example.com',
  phone: '+1234567891',
  firstName: 'Bob',
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
// REMOVE ALL MOCK DOCTOR IDS AND REPLACE WITH REAL FIRESTORE IDS
// Example real Firestore doctor IDs:
//   45979614-7c03-4630-a5f2-8aff9be32f97
//   5787dd5a-1c8b-4f6b-8d66-aa8f31347d76
//   e12648f0-71c2-4016-8a8d-112dd28d62fe

// All mock doctor/user IDs like 'user_doctor_001', 'user_doctor_002', etc. are replaced below.

export const mockDoctorProfilesArray: DoctorProfile[] = [
  {
    userId: '45979614-7c03-4630-a5f2-8aff9be32f97',
    specialty: 'Family Medicine',
    licenseNumber: 'FM123456',
    yearsOfExperience: 15,
    education: 'MD, Harvard',
    educationHistory: [
      { institution: 'Harvard', degree: 'MD', field: 'Medicine', startYear: 2005, endYear: 2009 },
    ],
    experience: [
      { organization: 'General Hospital', position: 'Physician', startYear: 2010, endYear: 2020 }
    ],
    bio: 'Experienced family physician.',
    verificationStatus: VerificationStatus.APPROVED,
    verificationNotes: '',
    location: 'New York',
    languages: ['English', 'Spanish'],
    consultationFee: 120,
    profilePictureUrl: '',
    licenseDocumentUrl: 'https://example.com/license1.pdf',
    certificateUrl: 'https://example.com/certificate1.pdf',
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    userId: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
    specialty: 'Dermatology',
    licenseNumber: 'DERM789012',
    yearsOfExperience: 10,
    education: 'MD, Harvard Medical School',
    educationHistory: [
      { institution: 'Harvard Medical School', degree: 'MD', field: 'Medicine', startYear: 2005, endYear: 2009 },
    ],
    experience: [
      { organization: 'Dermatology Clinic', position: 'Dermatologist', startYear: 2010, endYear: 2020 }
    ],
    bio: 'Dermatologist specializing in skin cancer prevention.',
    verificationStatus: VerificationStatus.APPROVED,
    verificationNotes: '',
    location: 'Boston, MA',
    languages: ['English', 'Korean'],
    consultationFee: 200,
    profilePictureUrl: '',
    licenseDocumentUrl: 'https://example.com/license2.pdf',
    certificateUrl: 'https://example.com/certificate2.pdf',
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    userId: 'e12648f0-71c2-4016-8a8d-112dd28d62fe',
    specialty: 'Pediatrics',
    licenseNumber: 'PED567890',
    yearsOfExperience: 12,
    education: 'MD, Johns Hopkins University',
    educationHistory: [
      { institution: 'Johns Hopkins University', degree: 'MD', field: 'Medicine', startYear: 2005, endYear: 2009 },
    ],
    experience: [
      { organization: "Children's Hospital", position: 'Pediatrician', startYear: 2010, endYear: 2020 }
    ],
    bio: 'Pediatrician dedicated to children\'s health and wellness.',
    verificationStatus: VerificationStatus.APPROVED,
    verificationNotes: '',
    location: 'Philadelphia, PA',
    languages: ['English', 'French'],
    consultationFee: 175,
    profilePictureUrl: '',
    licenseDocumentUrl: 'https://example.com/license3.pdf',
    certificateUrl: 'https://example.com/certificate3.pdf',
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    userId: '4d7a3f6a-8f6d-4b5a-8a6f-3c4a5b6d7e8f',
    specialty: 'Orthopedic Surgery',
    licenseNumber: 'ORTH12345',
    yearsOfExperience: 15,
    education: 'MD, Mayo Clinic Alix School of Medicine',
    educationHistory: [
      { institution: 'Mayo Clinic Alix School of Medicine', degree: 'MD', field: 'Medicine', startYear: 2005, endYear: 2009 },
    ],
    experience: [
      { organization: 'Orthopedic Clinic', position: 'Orthopedic Surgeon', startYear: 2010, endYear: 2020 }
    ],
    bio: 'Orthopedic surgeon with a focus on sports injuries.',
    verificationStatus: VerificationStatus.APPROVED,
    verificationNotes: '',
    location: 'Boston, MA',
    languages: ['English', 'Korean'],
    consultationFee: 200,
    profilePictureUrl: '',
    licenseDocumentUrl: 'https://example.com/license4.pdf',
    certificateUrl: 'https://example.com/certificate4.pdf',
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date(),
  },
  {
    userId: '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7g8h9i',
    specialty: 'Neurology',
    licenseNumber: 'NEUR54321',
    yearsOfExperience: 12,
    education: 'MD, Harvard Medical School',
    educationHistory: [
      { institution: 'Harvard Medical School', degree: 'MD', field: 'Medicine', startYear: 2005, endYear: 2009 },
    ],
    experience: [
      { organization: 'Neurology Clinic', position: 'Neurologist', startYear: 2010, endYear: 2020 }
    ],
    bio: 'Neurologist passionate about brain health and research.',
    verificationStatus: VerificationStatus.APPROVED,
    verificationNotes: '',
    location: 'Boston, MA',
    languages: ['English', 'Portuguese', 'Spanish'],
    consultationFee: 225,
    profilePictureUrl: '',
    licenseDocumentUrl: 'https://example.com/license5.pdf',
    certificateUrl: 'https://example.com/certificate5.pdf',
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date(),
  },
];

// Repeat this pattern for any other mock doctor/user objects in this file, always replacing mock IDs with real Firestore IDs.

// --- Appointment Mocks ---
export const mockAppointmentsArray: Appointment[] = [
  {
    id: 'appt_001',
    patientId: mockPatientUser.id,
    patientName: 'Alice Smith',
    doctorId: mockDoctorUser.id,
    doctorName: 'Bob Johnson',
    doctorSpecialty: 'Family Medicine',
    appointmentDate: new Date('2025-05-01T09:00:00Z'),
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.CONFIRMED,
    reason: 'Routine checkup',
    notes: '',
    createdAt: new Date('2025-04-01T10:00:00Z'),
    updatedAt: new Date('2025-04-01T10:00:00Z'),
    appointmentType: 'In-person',
  },
  {
    id: 'appt_002',
    patientId: mockPatientUser.id,
    patientName: 'Alice Smith',
    doctorId: mockDoctorUser.id,
    doctorName: 'Bob Johnson',
    doctorSpecialty: 'Family Medicine',
    appointmentDate: new Date('2025-05-10T09:00:00Z'),
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.PENDING,
    reason: 'Consultation for chest pain',
    notes: '',
    createdAt: new Date('2025-04-10T09:00:00Z'),
    updatedAt: new Date('2025-04-10T09:00:00Z'),
    appointmentType: 'Video',
  },
  {
    id: 'appt_003',
    patientId: mockPatientUser.id,
    patientName: 'Alice Smith',
    doctorId: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
    doctorName: 'Jane Lee',
    doctorSpecialty: 'Dermatology',
    appointmentDate: new Date('2024-02-15T09:00:00Z'),
    startTime: '09:00',
    endTime: '09:30',
    status: AppointmentStatus.CANCELLED,
    reason: 'Follow-up for skin rash',
    notes: 'Patient cancelled due to travel.',
    createdAt: new Date('2024-02-01T10:00:00Z'),
    updatedAt: new Date('2024-02-01T10:00:00Z'),
    appointmentType: 'In-person',
  },
];

// --- Doctor Availability Slot Mocks ---
export const mockDoctorAvailabilitySlots: DoctorAvailabilitySlot[] = [
  {
    doctorId: mockDoctorUser.id,
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    doctorId: mockDoctorUser.id,
    dayOfWeek: 2,
    startTime: '13:00',
    endTime: '17:00',
    isAvailable: true,
  },
  {
    doctorId: mockDoctorUser.id,
    dayOfWeek: 4,
    startTime: '10:00',
    endTime: '15:00',
    isAvailable: true,
  },
  {
    doctorId: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '12:00',
    isAvailable: true,
  },
  {
    doctorId: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
    dayOfWeek: 3,
    startTime: '13:00',
    endTime: '18:00',
    isAvailable: true,
  },
];

// --- Verification Document Mocks ---
export const mockVerificationDocuments: VerificationDocument[] = [
  {
    doctorId: mockDoctorUser.id,
    documentType: 'License',
    fileUrl: 'https://example.com/license.pdf',
    uploadedAt: Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
  },
  {
    doctorId: mockDoctorUser.id,
    documentType: 'Certificate',
    fileUrl: 'https://example.com/certificate.pdf',
    uploadedAt: Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
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
    doctorId: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
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
    doctorId: 'e12648f0-71c2-4016-8a8d-112dd28d62fe',
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
    doctorId: '4d7a3f6a-8f6d-4b5a-8a6f-3c4a5b6d7e8f',
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
    doctorId: '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7g8h9i',
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

// Additional user data for new doctors
export const mockDoctorUser4: UserProfile = {
  id: '4d7a3f6a-8f6d-4b5a-8a6f-3c4a5b6d7e8f',
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
  id: '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7g8h9i',
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
  id: '6c7d8e9f-0a1b-2c3d-4e5f-6g7h8i9j',
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
  id: '7e8f9g0h-1i2j3k4-5l6m7n8o',
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
  id: '8f9g0h1i-2j3k4l5-6m7n8o9p',
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
  id: '5787dd5a-1c8b-4f6b-8d66-aa8f31347d76',
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
  id: 'e12648f0-71c2-4016-8a8d-112dd28d62fe',
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
