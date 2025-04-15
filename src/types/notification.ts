/**
 * Represents a system notification sent to a specific user.
 */
import { Timestamp } from 'firebase/firestore';

/**
 * Notification defines the structure for user-facing system notifications.
 */
export interface Notification {
  /** Optional unique identifier for the notification (Firestore doc ID). */
  id?: string;
  /** Foreign Key matching the recipient user (UserProfile.id). */
  userId: string;
  /** Title of the notification (short, user-facing). */
  title: string;
  /** Main message body of the notification. */
  message: string;
  /** Whether the notification has been read by the user. */
  isRead: boolean;
  /** Timestamp of when the notification was created. */
  createdAt: Timestamp;
  /** Type of notification (e.g., appointment_booked, verification_approved, system, etc.). */
  type: 'appointment_booked' | 'verification_approved' | 'system' | string;
  /** Related entity ID (e.g., appointmentId, verificationId), if applicable. */
  relatedId?: string | null;
}
