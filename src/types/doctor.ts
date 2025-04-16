/**
 * Represents doctor-specific professional data, linked to a UserProfile.
 */
import { VerificationStatus } from './enums';
import { Timestamp } from 'firebase/firestore';

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
  /** @PHI Short professional biography or summary. */
  bio: string;
  /** Current verification status for this doctor. */
  verificationStatus: VerificationStatus;
  /** Notes from admin regarding verification (optional). */
  verificationNotes?: string;
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
  // Add createdAt and updatedAt for mock/real compatibility
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
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
