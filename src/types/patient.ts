/**
 * Represents patient-specific data, linked to a UserProfile.
 */
import { Timestamp } from 'firebase/firestore';

/**
 * PatientProfile defines additional fields for patient users.
 */
export interface PatientProfile {
  /** Foreign Key matching the UserProfile.id of the patient user. */
  userId: string;
  /** @PHI Patient's date of birth. */
  dateOfBirth: Date | Timestamp | null;
  /** @PHI Patient's self-identified gender. */
  gender: 'Male' | 'Female' | 'Other' | null;
  /** @PHI Patient's blood type (e.g., "A+", "O-"). Consider a specific enum later if needed. */
  bloodType: string | null;
  /** @PHI Brief summary of patient's medical history or relevant conditions. */
  medicalHistory: string | null;
}
