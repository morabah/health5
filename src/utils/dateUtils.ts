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
  
  try {
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (
      date && 
      typeof date === 'object' && 
      'toDate' in date && 
      typeof date.toDate === 'function'
    ) {
      // Safer check for Timestamp objects
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      console.warn('Unknown date format:', date);
      return 'Invalid date format';
    }
    
    // Check if the date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return 'Invalid date';
    }
    
    // Format using Intl.DateTimeFormat for localization
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Date error';
  }
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
  
  try {
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (
      date && 
      typeof date === 'object' && 
      'toDate' in date && 
      typeof date.toDate === 'function'
    ) {
      // Safer check for Timestamp objects
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      console.warn('Unknown date format in isPastDate:', date);
      return false;
    }
    
    // Check if the date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to isPastDate:', date);
      return false;
    }
    
    // Compare with current date
    return dateObj < new Date();
  } catch (error) {
    console.error('Error checking if date is past:', error, date);
    return false;
  }
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
    
    // Special handling for serialized Timestamp or date objects
    if ('seconds' in dateInput && 'nanoseconds' in dateInput) {
      return new Date(dateInput.seconds * 1000);
    }
  }

  // Default fallback
  return new Date();
} 