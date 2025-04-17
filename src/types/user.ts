/**
 * Represents the core user profile data stored in Firestore, common to all roles.
 */
import { UserType, VerificationStatus } from './enums';
import { Timestamp } from 'firebase/firestore';

/**
 * UserProfile defines the structure of user data in Firestore for all user roles.
 */
export interface UserProfile {
  /** Firestore document ID, identical to Firebase Auth UID. */
  id: string;
  /** User's email address, potentially null if using phone auth only. */
  email: string | null;
  /** User's phone number, potentially null. */
  phone: string | null;
  /** User's first name. */
  firstName: string;
  /** User's last name. */
  lastName: string;
  /** The role of the user within the system. */
  userType: UserType;
  /** Flag indicating if the user account is active (e.g., not disabled by admin). */
  isActive?: boolean;
  /** Flag indicating if the user's email has been verified. */
  emailVerified?: boolean;
  /** Flag indicating if the user's phone number has been verified. */
  phoneVerified?: boolean;
  /** Timestamp of when the user profile document was created. */
  createdAt?: string | Date;
  /** Timestamp of the last update to the user profile document. */
  updatedAt?: string | Date;
  // Doctor-specific fields
  specialty?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  education?: string;
  bio?: string;
  languages?: string[];
  location?: string;
  consultationFee?: number;
  profilePictureUrl?: string;
  licenseDocumentUrl?: string;
  certificateUrl?: string;
  verificationStatus?: VerificationStatus;
}
