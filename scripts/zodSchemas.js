const { z } = require('zod');

// UserProfile
const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  userType: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any(), // Firestore Timestamp
});

// PatientProfile
const PatientProfileSchema = z.object({
  userId: z.string(),
  dateOfBirth: z.any().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  bloodType: z.string().nullable(),
  medicalHistory: z.string().nullable(),
});

// DoctorProfile
const DoctorProfileSchema = z.object({
  userId: z.string(),
  specialty: z.string(),
  licenseNumber: z.string(),
  yearsOfExperience: z.number(),
  education: z.string(),
  bio: z.string(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  verificationNotes: z.string().optional(),
  location: z.string(),
  languages: z.array(z.string()),
  consultationFee: z.number(),
  profilePictureUrl: z.string().nullable(),
  licenseDocumentUrl: z.string().nullable(),
  certificateUrl: z.string().nullable(),
});

// DoctorAvailabilitySlot
const DoctorAvailabilitySlotSchema = z.object({
  id: z.string(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

// VerificationDocument
const VerificationDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  url: z.string(),
  uploadedAt: z.any(), // Firestore Timestamp
});

// Appointment
const AppointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  patientName: z.string().optional(),
  doctorId: z.string(),
  doctorName: z.string().optional(),
  doctorSpecialty: z.string().optional(),
  appointmentDate: z.any(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  reason: z.string(),
  notes: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
  appointmentType: z.enum(['In-person', 'Video']).optional(),
});

// Notification
const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.any(),
  type: z.string(),
  relatedId: z.string().nullable().optional(),
});

module.exports = {
  UserProfileSchema,
  PatientProfileSchema,
  DoctorProfileSchema,
  DoctorAvailabilitySlotSchema,
  VerificationDocumentSchema,
  AppointmentSchema,
  NotificationSchema,
};
