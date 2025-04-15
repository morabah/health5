import { z } from 'zod';

export const UserProfileSchema = z.object({
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

// Create a robust gender enum handler that:
// 1. Accepts standard values
// 2. Maps similar/variant values to standard ones
// 3. Has a default fallback
const genderSchema = z.string()
  .transform(val => {
    if (!val) return 'Other';
    
    // Normalize to lowercase for case-insensitive comparison
    const normalized = val.toLowerCase();
    
    // Map to standard values
    if (normalized === 'male' || normalized === 'm') return 'Male';
    if (normalized === 'female' || normalized === 'f') return 'Female';
    if (normalized.includes('prefer_not') || normalized.includes('not_to_say') || normalized.includes('other')) return 'Other';
    
    // Default fallback
    return 'Other';
  })
  .pipe(z.enum(['Male', 'Female', 'Other']));

export const PatientProfileSchema = z.object({
  userId: z.string(),
  dateOfBirth: z.any().nullable().optional().default(null),
  gender: genderSchema.nullable().default('Other'),
  bloodType: z.string().nullable().optional().default(null),
  medicalHistory: z.string().nullable().default('No medical history provided'),
});

export const DoctorProfileSchema = z.object({
  userId: z.string(),
  specialty: z.string().default('General Medicine'),
  licenseNumber: z.string().default('LICENSE-DEFAULT'),
  yearsOfExperience: z.number().default(0),
  education: z.string().default('Not specified'),
  bio: z.string().default(''),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
  verificationNotes: z.string().optional().default(''),
  location: z.string().default('Main Clinic'),
  languages: z.array(z.string()).default(['English']),
  consultationFee: z.number().default(0),
  profilePictureUrl: z.string().nullable().default(null),
  licenseDocumentUrl: z.string().nullable().default(null),
  certificateUrl: z.string().nullable().default(null),
});

export const DoctorAvailabilitySlotSchema = z.object({
  id: z.string(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export const VerificationDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  url: z.string(),
  uploadedAt: z.any(), // Firestore Timestamp
});

export const AppointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  patientName: z.string().optional().default(''),
  doctorId: z.string(),
  doctorName: z.string().optional().default(''),
  doctorSpecialty: z.string().optional().default(''),
  appointmentDate: z.any(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  reason: z.string().default(''),
  notes: z.string().default(''),
  createdAt: z.any(),
  updatedAt: z.any(),
  appointmentType: z.enum(['In-person', 'Video']).optional().default('In-person'),
});

export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.any(),
  type: z.string(),
  relatedId: z.string().nullable().optional(),
});
