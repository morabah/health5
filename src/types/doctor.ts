/**
 * Represents doctor-specific professional data, linked to a UserProfile.
 */
import { VerificationStatus } from './enums';
import { Timestamp } from 'firebase/firestore';

/**
 * Represents an education entry in a doctor's profile
 */
export interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  isOngoing?: boolean;
}

/**
 * Represents an experience entry in a doctor's profile
 */
export interface ExperienceEntry {
  id?: string;
  organization: string;
  position: string;
  location?: string;
  startYear: number;
  endYear?: number;
  isOngoing?: boolean;
  description?: string;
}

/**
 * DoctorProfile contains professional and verification data for doctor users.
 */
export interface DoctorProfile {
  /** Foreign Key matching the UserProfile.id of the doctor user. */
  userId: string;
  /** Doctor's medical specialty (e.g., "Cardiology"). */
  specialty: string;
  /** Medical license number. */
  licenseNumber: string;
  /** Years of professional experience. */
  yearsOfExperience: number;
  /** Highest education attained (e.g., "MD, Harvard"). */
  education: string;
  /** Detailed education entries */
  educationHistory?: EducationEntry[];
  /** Detailed experience entries */
  experience?: ExperienceEntry[];
  /** @PHI Short professional biography or summary. */
  bio: string;
  /** Current verification status for this doctor. */
  verificationStatus: VerificationStatus;
  /** Notes from admin regarding verification (optional). */
  verificationNotes?: string;
  /** Admin notes for internal use only */
  adminNotes?: string;
  /** Practice location (e.g., city, address, or region). */
  location: string;
  /** Languages spoken by the doctor. */
  languages: string[];
  /** Standard consultation fee in the local currency. */
  consultationFee: number;
  /** Public URL to the doctor's profile picture. */
  profilePictureUrl: string | null;
  /** Secure URL to the uploaded license document. */
  licenseDocumentUrl: string | null;
  /** Secure URL to the uploaded certificate document. */
  certificateUrl: string | null;
  /** Documents uploaded for verification */
  verificationDocuments?: VerificationDocument[];
  /** Weekly availability schedule */
  weeklySchedule?: WeeklySchedule;
  /** Dates that are blocked regardless of weekly schedule */
  blockedDates?: Date[] | string[];
  // Add createdAt and updatedAt for mock/real compatibility
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  /** Verification data including submission timestamps and document uploads. */
  verificationData?: DoctorVerificationData;
  /** Mock availability data structure for storing slots and blocked dates */
  mockAvailability?: {
    slots: any[];
    blockedDates: string[];
  };
}

/**
 * Represents a recurring weekly availability slot for a doctor.
 */
export interface DoctorAvailabilitySlot {
  /** Optional unique identifier for the slot (Firestore doc ID). */
  id?: string;
  /** Foreign Key matching the doctor user (UserProfile.id). */
  doctorId: string;
  /** Day of the week (0 = Sunday, 6 = Saturday). */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Start time in 24-hour format (e.g., "09:00"). */
  startTime: string;
  /** End time in 24-hour format (e.g., "17:00"). */
  endTime: string;
  /** Indicates if the doctor is available during this slot. */
  isAvailable: boolean;
}

/**
 * Represents a document uploaded by a doctor for verification purposes.
 */
export interface VerificationDocument {
  /** Optional unique identifier for the document (Firestore doc ID). */
  id?: string;
  /** Foreign Key matching the doctor user (UserProfile.id). */
  doctorId: string;
  /** Type of document (e.g., 'License', 'Certificate'). */
  documentType: 'License' | 'Certificate' | string;
  /** Secure URL to the uploaded file. */
  fileUrl: string;
  /** Timestamp of when the document was uploaded. */
  uploadedAt: Timestamp;
}

/**
 * Represents detailed verification data for a doctor.
 */
export interface DoctorVerificationData {
  /** Foreign Key matching the doctor user (UserProfile.id). */
  doctorId: string;
  /** Full name of the doctor (for verification purposes). */
  fullName: string;
  /** Medical specialty of the doctor. */
  specialty: string;
  /** Medical license number for verification. */
  licenseNumber: string;
  /** Name of the issuing authority for the license. */
  licenseAuthority: string;
  /** Current verification status. */
  status: VerificationStatus;
  /** Upload URLs for verification documents. */
  documents: {
    licenseUrl: string | null;
    certificateUrl: string | null;
    identificationUrl: string | null;
  };
  /** Date when verification documents were submitted. */
  submissionDate: Date | Timestamp;
  /** Date when verification status was last updated. */
  lastUpdated: Date | Timestamp;
  /** Optional notes from administrator regarding verification. */
  adminNotes?: string;
  /** Optional public profile picture URL */
  profilePictureUrl?: string | null;
  /** Years of professional experience */
  experience?: number;
  /** Practice location */
  location?: string;
  /** Languages spoken */
  languages?: string[];
  /** Consultation fee */
  fee?: number;
}

/**
 * Simplified doctor verification data for admin listing
 */
export interface DoctorVerification {
  /** ID of the doctor (matches UserProfile.id) */
  id: string;
  /** Doctor's full name */
  name?: string;
  /** Current verification status */
  status: VerificationStatus;
  /** When the doctor submitted their verification materials */
  dateSubmitted: Date | string;
  /** Doctor's specialty */
  specialty?: string;
}

/**
 * Represents a weekly schedule for doctor availability.
 */
export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  [key: number]: TimeSlot[];
  [key: string]: TimeSlot[];
}

/**
 * Represents a time slot with start and end times.
 */
export interface TimeSlot {
  startTime: string; // in format HH:MM
  endTime: string;   // in format HH:MM
  isAvailable?: boolean;
}

/**
 * Validates a WeeklySchedule object to ensure it has all required days.
 * @param schedule The schedule to validate
 * @returns True if valid, false otherwise
 */
export function isValidWeeklySchedule(schedule: any): schedule is WeeklySchedule {
  if (!schedule || typeof schedule !== 'object') {
    return false;
  }
  
  const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of requiredDays) {
    if (!Array.isArray(schedule[day])) {
      return false;
    }
    
    // Validate each time slot
    for (const slot of schedule[day]) {
      if (typeof slot !== 'object' || !slot.startTime || !slot.endTime) {
        return false;
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return false;
      }
    }
  }
  
  return true;
}
