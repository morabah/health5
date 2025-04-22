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
  licenseUrl: z.string().nullable(),
  certificateUrl: z.string().nullable(),
  identificationUrl: z.string().nullable()
});

// Schema for detailed doctor verification data
export const DoctorVerificationDataSchema = z.object({
  doctorId: z.string(),
  fullName: z.string(),
  specialty: z.string(),
  licenseNumber: z.string(),
  licenseAuthority: z.string(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']),
  documents: VerificationDocumentsSchema,
  submissionDate: timestampSchema,
  lastUpdated: timestampSchema,
  adminNotes: z.string().optional(),
  profilePictureUrl: z.string().nullable().optional(),
  experience: z.number().optional(),
  location: z.string().optional(),
  languages: z.array(z.string()).optional(),
  fee: z.number().optional()
});

// Schema for simplified doctor verification data in admin listing
export const DoctorVerificationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'pending', 'approved', 'rejected', 'more_info_required']),
  dateSubmitted: timestampSchema,
  specialty: z.string().optional(),
  experience: z.number().optional(),
  location: z.string().optional()
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
  type: z.enum(['APPOINTMENT', 'SYSTEM', 'VERIFICATION', 'appointment_booked', 'verification_approved', 'system']).optional().default('SYSTEM'),
  relatedId: z.string().nullable().optional(), // ID of related resource (appointment, etc)
});
