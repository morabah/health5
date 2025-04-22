import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { VerificationStatus as VerificationStatusEnum, AppointmentStatus } from '../types/enums';

// Custom validator for Firestore Timestamp or Date objects
const timestampSchema = z.custom<Date | Timestamp>((val) => 
  val instanceof Date || 
  (val && typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function')
).optional();

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  userType: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
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
  dateOfBirth: timestampSchema.nullable().default(null),
  gender: genderSchema.nullable().default('Other'),
  bloodType: z.string().nullable().optional().default(null),
  medicalHistory: z.string().nullable().default('No medical history provided'),
});

// Education entry schema - used for doctor's detailed education history
export const EducationEntrySchema = z.object({
  id: z.string().optional(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startYear: z.number(),
  endYear: z.number().optional(),
  isOngoing: z.boolean().optional(),
  description: z.string().optional()
});

// Experience entry schema - used for doctor's detailed professional experience
export const ExperienceEntrySchema = z.object({
  id: z.string().optional(),
  organization: z.string(),
  position: z.string(),
  location: z.string().optional(),
  startYear: z.number(),
  endYear: z.number().optional(),
  isOngoing: z.boolean().optional(),
  description: z.string().optional()
});

// Time slot schema - for individual availability time slots
export const TimeSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean().default(true)
});

// Weekly schedule schema - for doctor's recurring availability
export const WeeklyScheduleSchema = z.object({
  monday: z.array(TimeSlotSchema).default([]),
  tuesday: z.array(TimeSlotSchema).default([]),
  wednesday: z.array(TimeSlotSchema).default([]),
  thursday: z.array(TimeSlotSchema).default([]),
  friday: z.array(TimeSlotSchema).default([]),
  saturday: z.array(TimeSlotSchema).default([]),
  sunday: z.array(TimeSlotSchema).default([])
});

export const DoctorProfileSchema = z.object({
  userId: z.string(),
  specialty: z.string().default('General Medicine'),
  licenseNumber: z.string().default('LICENSE-DEFAULT'),
  yearsOfExperience: z.number().default(0),
  education: z.string().default('Not specified'),
  bio: z.string().default(''),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']).default('PENDING'),
  verificationNotes: z.string().optional().default(''),
  adminNotes: z.string().optional().default(''),
  location: z.string().default('Main Clinic'),
  languages: z.array(z.string()).default(['English']),
  consultationFee: z.number().default(0),
  profilePictureUrl: z.string().nullable().default(null),
  licenseDocumentUrl: z.string().nullable().default(null),
  certificateUrl: z.string().nullable().default(null),
  // Added fields for detailed history to align with APPLICATION_BLUEPRINT.md
  educationHistory: z.array(EducationEntrySchema).optional().default([]),
  experience: z.array(ExperienceEntrySchema).optional().default([]),
  // Weekly availability schedule (now using proper schema)
  weeklySchedule: WeeklyScheduleSchema.optional(),
  // Dates that are blocked regardless of weekly schedule
  blockedDates: z.array(timestampSchema).optional().default([]),
  // Timestamps
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const DoctorAvailabilitySlotSchema = z.object({
  id: z.string().optional(),
  // Doctor this slot belongs to
  doctorId: z.string(),
  // Using 0-6 for days of the week (0 = Sunday, 6 = Saturday) per blueprint
  dayOfWeek: z.union([
    z.literal(0), z.literal(1), z.literal(2), 
    z.literal(3), z.literal(4), z.literal(5), z.literal(6)
  ]),
  startTime: z.string(),
  endTime: z.string(),
  // Flag to indicate availability - can be used to block specific slots
  isAvailable: z.boolean().default(true)
});

// Schema for verification document uploads
export const VerificationDocumentSchema = z.object({
  id: z.string().optional(),
  // Direct reference to the doctor this document belongs to
  doctorId: z.string(),
  // Document types enumerated as per requirements
  documentType: z.enum(['License', 'Certificate', 'Identification', 'Other']),
  fileUrl: z.string(),
  uploadedAt: timestampSchema,
  // Metadata about the document (optional)
  description: z.string().optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']).optional().default('PENDING'),
  notes: z.string().optional()
});

// Schema for nested documents object in DoctorVerificationData
export const VerificationDocumentsSchema = z.object({
  licenseDocument: z.string().nullable().optional(),
  medicalCertificates: z.array(z.string()).optional().default([]),
  identityProof: z.string().nullable().optional(),
  // Legacy field compatibility
  licenseUrl: z.string().nullable().optional(),
  certificateUrl: z.string().nullable().optional(),
  identificationUrl: z.string().nullable().optional()
});

// Schema for detailed doctor verification data
export const DoctorVerificationDataSchema = z.object({
  doctorId: z.string().optional(),
  userId: z.string().optional(), // Some documents may use userId instead of doctorId
  fullName: z.string().optional().default(''),
  specialty: z.string().optional().default(''),
  licenseNumber: z.string().optional().default(''),
  licenseAuthority: z.string().optional().default(''),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']).optional().default('PENDING'),
  documents: VerificationDocumentsSchema.optional().default({}),
  submissionDate: timestampSchema,
  lastUpdated: timestampSchema,
  adminNotes: z.string().optional().default(''),
  // Legacy field compatibility
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
  updatedAt: timestampSchema, // For backward compatibility
  // Additional profile fields that might exist
  profilePictureUrl: z.string().nullable().optional(),
  experience: z.number().optional(),
  location: z.string().optional(),
  languages: z.array(z.string()).optional(),
  fee: z.number().optional(),
  // Migration tracking
  _migratedAt: timestampSchema.optional()
});

// Schema for simplified doctor verification data in admin listing
export const DoctorVerificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  doctorId: z.string().optional(),
  specialty: z.string().optional().default(''),
  licenseNumber: z.string().optional().default(''),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected']).optional().default('PENDING'),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected']).optional(),
  name: z.string().nullable().optional(),
  submissionDate: timestampSchema,
  lastUpdated: timestampSchema,
  verificationNotes: z.string().optional(),
  notes: z.string().optional(),
  adminNotes: z.string().optional(),
  // Additional listing fields
  dateSubmitted: timestampSchema.optional(),
  experience: z.number().optional(),
  location: z.string().optional(),
  // Migration tracking
  _migratedAt: timestampSchema.optional()
});

// Schema for verification request
export const VerificationRequestSchema = z.object({
  id: z.string().optional(),
  doctorId: z.string(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']),
  submittedAt: timestampSchema,
  updatedAt: timestampSchema,
  documents: VerificationDocumentsSchema
});

// Schema for verification history entry
export const VerificationHistoryEntrySchema = z.object({
  id: z.string().optional(),
  doctorId: z.string(),
  previousStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']),
  newStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']),
  changedByAdminId: z.string(),
  timestamp: timestampSchema,
  notes: z.string().optional()
});

// Schema for system log
export const SystemLogSchema = z.object({
  id: z.string().optional(),
  action: z.enum(['verification_status_change', 'login', 'registration', 'appointment_status_change']),
  adminId: z.string(),
  targetUserId: z.string(),
  timestamp: timestampSchema,
  details: z.string()
});

export const AppointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  patientName: z.string().optional().default(''),
  doctorId: z.string(),
  doctorName: z.string().optional().default(''),
  doctorSpecialty: z.string().optional().default(''),
  appointmentDate: timestampSchema,
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum([
    'PENDING', 'CONFIRMED', 'SCHEDULED', 'CANCELLED', 
    'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 
    'COMPLETED', 'NO_SHOW', 'RESCHEDULED'
  ]),
  reason: z.string().default(''),
  notes: z.string().default(''),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  appointmentType: z.enum(['In-person', 'Video']).optional().default('In-person'),
});

export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: timestampSchema,
  // Accept all notification types, but document the main ones
  type: z.string().describe("E.g. 'appointment_booked', 'verification_approved', 'system', 'appointment_reminder', etc.").optional().default('system'),
  relatedId: z.string().nullable().optional(), // ID of related resource (appointment, etc)
});

// Authentication Schemas
export const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

// Base registration fields without the discriminator
const registerBaseObject = {
  email: z.string().email('Please provide a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  })
};

// Create standalone schemas without inheritance

// Patient registration schema
export const PatientRegisterSchema = z.object({
  ...registerBaseObject,
  userType: z.literal('PATIENT'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Doctor registration schema
export const DoctorRegisterSchema = z.object({
  ...registerBaseObject,
  userType: z.literal('DOCTOR'),
  specialty: z.string().min(1, 'Specialty is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Combined schema using discriminated union
export const RegisterSchema = z.union([
  PatientRegisterSchema,
  DoctorRegisterSchema
]);

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const PasswordResetConfirmSchema = z.object({
  code: z.string().min(6, 'Verification code must be at least 6 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please provide a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const DoctorSearchSchema = z.object({
  specialty: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  nameFilter: z.string().optional(),
  sortBy: z.enum(['rating', 'experience', 'price']).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
});
