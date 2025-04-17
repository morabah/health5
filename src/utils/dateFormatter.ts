/**
 * Date Formatter Utility
 * 
 * This utility provides consistent date formatting functions across the application.
 * It handles both Date objects and Firestore Timestamp objects.
 */
import { Timestamp } from 'firebase/firestore';

/**
 * Formats a date object or Timestamp to a standard date string format
 * 
 * @param date - The date to format (Date or Timestamp)
 * @param options - Optional formatting options
 * @returns A formatted date string
 */
export function formatDate(date: Date | Timestamp | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  
  // Convert to Date object if it's a Timestamp
  const dateObj = getDateObject(date);
  
  // Default options for date formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  // Use provided options or defaults
  const formatOptions = options || defaultOptions;
  
  return dateObj.toLocaleDateString(undefined, formatOptions);
}

/**
 * Formats a date object or Timestamp to a standard time string format
 * 
 * @param date - The date to format (Date or Timestamp)
 * @param options - Optional formatting options
 * @returns A formatted time string
 */
export function formatTime(date: Date | Timestamp | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  
  // Convert to Date object if it's a Timestamp
  const dateObj = getDateObject(date);
  
  // Default options for time formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Use provided options or defaults
  const formatOptions = options || defaultOptions;
  
  return dateObj.toLocaleTimeString(undefined, formatOptions);
}

/**
 * Formats a date object or Timestamp to a standard datetime string format
 * 
 * @param date - The date to format (Date or Timestamp)
 * @param options - Optional formatting options
 * @returns A formatted datetime string
 */
export function formatDateTime(date: Date | Timestamp | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  
  // Convert to Date object if it's a Timestamp
  const dateObj = getDateObject(date);
  
  // Default options for datetime formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Use provided options or defaults
  const formatOptions = options || defaultOptions;
  
  return dateObj.toLocaleString(undefined, formatOptions);
}

/**
 * Formats a datetime to a relative time string (e.g., "2 hours ago")
 * 
 * @param date - The date to format (Date or Timestamp)
 * @returns A relative time string
 */
export function formatRelativeTime(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return '';
  
  // Convert to Date object if it's a Timestamp
  const dateObj = getDateObject(date);
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Converts a Timestamp, string, or Date to a Date object
 * 
 * @param date - The date to convert (Date, Timestamp, or string)
 * @returns A native Date object
 */
export function getDateObject(date: Date | Timestamp | string | null | undefined): Date {
  if (!date) return new Date();
  
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'string') {
    return new Date(date);
  }
  
  // Handle Firestore Timestamp (has toDate method)
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // Default fallback
  return new Date();
} 