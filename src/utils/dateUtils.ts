/**
 * Date utility functions for consistent date handling across the application
 */
import { Timestamp } from 'firebase/firestore';

/**
 * Formats a date for display in the UI
 * @param date Date, Timestamp, or ISO string
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | Timestamp | string | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  if (!date) return 'Not scheduled';
  const dateObj = getDateObject(date);
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Checks if a date is in the past
 * @param date Date, Timestamp, or ISO string
 * @returns true if the date is in the past
 */
export function isPastDate(
  date: Date | Timestamp | string | undefined | null
): boolean {
  if (!date) return false;
  const dateObj = getDateObject(date);
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to isPastDate:', date);
    return false;
  }
  return dateObj < new Date();
}

/**
 * Utility to convert various date-like objects to standard Date objects.
 */
/**
 * Converts a Timestamp, string, or Date to a standard Date object
 * 
 * @param dateInput - Input date (Date, Timestamp, or string)
 * @returns A native JavaScript Date object
 */
export function getDateObject(dateInput: Date | Timestamp | any): Date {
  if (!dateInput) return new Date();

  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'string') {
    return new Date(dateInput);
  }

  // Handle Firestore Timestamp objects (which have toDate method)
  if (typeof dateInput === 'object' && dateInput !== null) {
    // Check if it's a Firestore Timestamp
    if (typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    // Special handling for serialized Timestamp (_seconds/_nanoseconds or seconds/nanoseconds)
    const sec = (dateInput.seconds as number | undefined) ?? (dateInput._seconds as number | undefined);
    if (typeof sec === 'number') {
      return new Date(sec * 1000);
    }
  }

  // Default fallback
  return new Date();
}