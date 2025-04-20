// Plain JS mock data for Node scripts (no imports, no types)
const admin = require('firebase-admin');

// --- Bulk Mock Data Generation ---
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const specialties = ['Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics', 'Oncology', 'Psychiatry', 'Radiology', 'General Surgery', 'Family Medicine'];
const verificationStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
const genders = ['Male', 'Female', 'Other'];
const appointmentStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const appointmentTypes = ['In-person', 'Video'];

const mockPatients = Array.from({ length: 15 }, (_, i) => ({
  id: `user_patient_${i + 1}`,
  email: `patient${i + 1}@example.com`,
  phone: `+12345678${900 + i}`,
  firstName: `Patient${i + 1}`,
  lastName: `Test`,
  userType: 'PATIENT',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2023-01-01'), new Date('2024-01-01'))),
  updatedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2024-01-01'), new Date())),
}));

const mockDoctors = Array.from({ length: 12 }, (_, i) => {
  const specialty = specialties[i % specialties.length];
  const verificationStatus = verificationStatuses[i % verificationStatuses.length];
  return {
    id: `user_doctor_${i + 1}`,
    email: `doctor${i + 1}@example.com`,
    phone: `+12345679${800 + i}`,
    firstName: `Doctor${i + 1}`,
    lastName: `Test`,
    userType: 'DOCTOR',
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2023-01-01'), new Date('2024-01-01'))),
    updatedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2024-01-01'), new Date())),
    // Profile fields
    specialty,
    licenseNumber: `DOC${10000 + i}`,
    yearsOfExperience: 3 + (i % 20),
    education: `${specialty} School`,
    bio: `Experienced ${specialty.toLowerCase()} doctor.`,
    verificationStatus,
    verificationNotes: verificationStatus === 'REJECTED' ? 'Incomplete documents' : 'All documents verified.',
    location: ['New York', 'San Francisco', 'Chicago', 'Houston'][i % 4],
    languages: ['English', ...(i % 2 === 0 ? ['Spanish'] : [])],
    consultationFee: 100 + (i * 10),
    profilePictureUrl: null,
    licenseDocumentUrl: null,
    certificateUrl: null,
  };
});

const mockAdmins = [{
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
}, {
  id: 'user_admin_002',
  email: 'admin2@example.com',
  phone: '+12345678913',
  firstName: 'Dana',
  lastName: 'Admin',
  userType: 'ADMIN',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
  updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T10:00:00Z')),
}];

const mockPatientProfiles = mockPatients.map((p, i) => ({
  userId: p.id,
  dateOfBirth: admin.firestore.Timestamp.fromDate(randomDate(new Date('1970-01-01'), new Date('2010-01-01'))),
  gender: genders[i % genders.length],
  bloodType: ['A+', 'O-', 'B+', 'AB-'][i % 4],
  medicalHistory: i % 3 === 0 ? 'Asthma' : i % 3 === 1 ? 'Diabetes' : 'None',
}));

const mockDoctorProfiles = mockDoctors.map((d, i) => ({
  userId: d.id,
  specialty: d.specialty,
  licenseNumber: d.licenseNumber,
  yearsOfExperience: d.yearsOfExperience,
  education: d.education,
  bio: d.bio,
  verificationStatus: d.verificationStatus,
  verificationNotes: d.verificationNotes,
  location: d.location,
  languages: d.languages,
  consultationFee: d.consultationFee,
  profilePictureUrl: null,
  licenseDocumentUrl: null,
  certificateUrl: null,
}));

const mockDoctorAvailabilities = mockDoctors.map((d, i) => ([
  {
    id: `slot${i + 1}_a`,
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i % 5],
    startTime: '09:00',
    endTime: '12:00'
  },
  {
    id: `slot${i + 1}_b`,
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][(i + 2) % 5],
    startTime: '14:00',
    endTime: '17:00'
  }
]));

const mockVerificationDocs = mockDoctors.map((d, i) => ([
  {
    id: `doc${i + 1}_a`,
    type: 'license',
    url: `https://example.com/license${i + 1}.pdf`,
    uploadedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2023-01-01'), new Date('2024-01-01'))),
  },
  {
    id: `doc${i + 1}_b`,
    type: 'certificate',
    url: `https://example.com/cert${i + 1}.pdf`,
    uploadedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2023-01-01'), new Date('2024-01-01'))),
  }
]));

const mockAppointmentsArray = [];
let apptId = 1;
mockPatients.forEach((patient, pi) => {
  mockDoctors.forEach((doctor, di) => {
    appointmentStatuses.forEach((status, si) => {
      appointmentTypes.forEach((apptType, ti) => {
        mockAppointmentsArray.push({
          id: `appt${apptId++}`,
          patientId: patient.id,
          patientName: patient.firstName + ' ' + patient.lastName,
          patientEmail: patient.email,
          doctorId: doctor.id,
          doctorName: doctor.firstName + ' ' + doctor.lastName,
          doctorEmail: doctor.email,
          doctorSpecialty: doctor.specialty,
          appointmentDate: admin.firestore.Timestamp.fromDate(randomDate(new Date('2024-05-01'), new Date('2024-12-31'))),
          startTime: '09:00',
          endTime: '09:30',
          status,
          reason: status === 'CANCELLED' ? 'Scheduling conflict' : status === 'COMPLETED' ? 'Routine checkup' : 'Consultation',
          notes: status === 'REJECTED' ? 'Reschedule required.' : '',
          createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2024-01-01'), new Date('2024-05-01'))),
          updatedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date('2024-05-01'), new Date())),
          appointmentType: apptType,
        });
      });
    });
  });
});

const mockNotificationsArray = mockAppointmentsArray.slice(0, 100).map((appt, i) => ({
  id: `notif${i + 1}`,
  userId: appt.patientId,
  userEmail: appt.patientEmail,
  title: `Appointment ${appt.status}`,
  message: `Your appointment with Dr. ${appt.doctorName} is ${appt.status.toLowerCase()}.`,
  isRead: i % 2 === 0,
  createdAt: appt.createdAt,
  type: 'appointment_' + appt.status.toLowerCase(),
  relatedId: appt.id,
}));

module.exports = {
  mockPatients,
  mockDoctors,
  mockAdmins,
  mockPatientProfiles,
  mockDoctorProfiles,
  mockDoctorAvailabilities,
  mockVerificationDocs,
  mockAppointmentsArray,
  mockNotificationsArray,
};
