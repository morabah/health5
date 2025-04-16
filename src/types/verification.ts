import { Timestamp } from 'firebase/firestore';
import { VerificationStatus } from './enums';

/**
 * Represents a system log entry for administrative tracking.
 */
export interface SystemLog {
  /** Unique identifier for the log entry. */
  id?: string;
  /** Type of action being logged. */
  action: 'verification_status_change' | 'login' | 'registration' | 'appointment_status_change';
  /** User ID of the administrator who performed the action. */
  adminId: string;
  /** Target user ID affected by the action. */
  targetUserId: string;
  /** Timestamp when the action occurred. */
  timestamp: Date | Timestamp;
  /** Additional details about the action (JSON stringified). */
  details: string;
}

/**
 * Represents a verification history entry for tracking status changes.
 */
export interface VerificationHistoryEntry {
  /** Unique identifier for the history entry. */
  id?: string;
  /** Doctor ID whose verification status changed. */
  doctorId: string;
  /** Previous verification status. */
  previousStatus: VerificationStatus;
  /** New verification status. */
  newStatus: VerificationStatus;
  /** Admin ID who changed the status. */
  changedByAdminId: string;
  /** Timestamp when the status was changed. */
  timestamp: Date | Timestamp;
  /** Notes provided by the admin regarding the change. */
  notes?: string;
}

/**
 * Verification request submitted by a doctor.
 */
export interface VerificationRequest {
  /** Unique identifier for the verification request. */
  id?: string;
  /** Doctor ID who submitted the request. */
  doctorId: string;
  /** Current status of the verification request. */
  status: VerificationStatus;
  /** Submission timestamp. */
  submittedAt: Date | Timestamp;
  /** Last updated timestamp. */
  updatedAt: Date | Timestamp;
  /** Document URLs submitted for verification. */
  documents: {
    licenseUrl: string | null;
    certificateUrl: string | null;
    identificationUrl: string | null;
  };
} 