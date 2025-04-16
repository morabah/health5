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
    minute: '2-digit'
  }
): string {
  if (!date) return 'Not scheduled';
  
  // Convert to Date object if needed
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }
  
  // Format using Intl.DateTimeFormat for localization
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Checks if a date is in the past
 * @param date Date, Timestamp, or ISO string
 * @returns true if the date is in the past
 */
export function isPastDate(date: Date | Timestamp | string | undefined | null): boolean {
  if (!date) return false;
  
  // Convert to Date object if needed
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to isPastDate:', date);
    return false;
  }
  
  // Compare with current date
  return dateObj < new Date();
}

/**
 * Gets a standardized Date object from various date formats
 * @param date Date, Timestamp, or ISO string
 * @returns Date object or null if invalid
 */
export function getDateObject(date: Date | Timestamp | string | undefined | null): Date | null {
  if (!date) return null;
  
  try {
    if (typeof date === 'string') {
      return new Date(date);
    } else if (date instanceof Timestamp) {
      return date.toDate();
    } else {
      return date;
    }
  } catch (error) {
    console.warn('Error converting date:', error);
    return null;
  }
} 