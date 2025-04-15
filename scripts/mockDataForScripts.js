// Plain JS mock data for Node scripts (no imports, no types)
const admin = require('firebase-admin');

const mockPatientUser = {
  id: 'user_patient_001',
  email: 'patient1@example.com',
  phone: '+12345678901',
  firstName: 'Alice',
  lastName: 'Smith',
  userType: 'PATIENT',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
  updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
};

const mockDoctorUser = {
  id: 'user_doctor_001',
  email: 'doctor1@example.com',
  phone: '+12345678902',
  firstName: 'Bob',
  lastName: 'Jones',
  userType: 'DOCTOR',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
  updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
};

const mockAdminUser = {
  id: 'user_admin_001',
  email: 'admin@example.com',
  phone: '+12345678903',
  firstName: 'Charlie',
  lastName: 'Admin',
  userType: 'ADMIN',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
  updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
};

const mockPatientProfileData = {
  userId: 'user_patient_001',
  dateOfBirth: admin.firestore.Timestamp.fromDate(new Date('1990-06-15T00:00:00Z')),
  gender: 'Female',
  bloodType: 'A+',
  medicalHistory: 'Asthma',
};

const mockDoctorProfileData1 = {
  userId: 'user_doctor_001',
  specialty: 'Cardiology',
  licenseNumber: 'DOC12345',
  yearsOfExperience: 10,
  education: 'Harvard Medical School',
  bio: 'Experienced cardiologist.',
  verificationStatus: 'VERIFIED',
  verificationNotes: 'All documents verified.',
  location: 'New York',
  languages: ['English', 'Spanish'],
  consultationFee: 200,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
};

const mockDoctorProfileData2 = {
  userId: 'user_doctor_002',
  specialty: 'Dermatology',
  licenseNumber: 'DOC67890',
  yearsOfExperience: 7,
  education: 'Stanford Medical School',
  bio: 'Dermatologist with a focus on eczema.',
  verificationStatus: 'PENDING',
  verificationNotes: '',
  location: 'San Francisco',
  languages: ['English'],
  consultationFee: 170,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
};

const mockDoctorAvailabilitySlot = {
  id: 'slot1',
  day: 'Monday',
  startTime: '09:00',
  endTime: '12:00',
};

const mockVerificationDocument = {
  id: 'doc1',
  type: 'license',
  url: 'https://example.com/license.pdf',
  uploadedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
};

const mockAppointmentsArray = [
  {
    id: 'appt1',
    patientId: 'user_patient_001',
    patientName: 'Alice Smith',
    doctorId: 'user_doctor_001',
    doctorName: 'Bob Jones',
    doctorSpecialty: 'Cardiology',
    appointmentDate: admin.firestore.Timestamp.fromDate(new Date('2024-05-01T14:00:00Z')),
    startTime: '14:00',
    endTime: '14:30',
    status: 'CONFIRMED',
    reason: 'Chest pain',
    notes: 'Bring previous ECG.',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-04-01T10:00:00Z')),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-04-01T10:00:00Z')),
    appointmentType: 'In-person',
  },
];

const mockNotificationsArray = [
  {
    id: 'notif1',
    userId: 'user_patient_001',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Bob Jones is confirmed.',
    isRead: false,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-04-01T10:00:00Z')),
    type: 'appointment_booked',
    relatedId: 'appt1',
  },
];

module.exports = {
  mockPatientUser,
  mockDoctorUser,
  mockAdminUser,
  mockPatientProfileData,
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorAvailabilitySlot,
  mockVerificationDocument,
  mockAppointmentsArray,
  mockNotificationsArray,
};
