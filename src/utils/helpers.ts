/**
 * Debounce function to limit the rate at which a function can fire.
 * Returns a function that will only execute after the specified delay has passed
 * since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a date to a human-readable string
 * @param date Date to format
 * @param format Format style ('short', 'medium', 'long', 'full')
 * @returns Formatted date string
 */
export function formatDate(date: Date | null | undefined, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
  if (!date) return '';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: format === 'short' ? 'numeric' : 'long', 
    day: 'numeric' 
  };
  
  if (format === 'full' || format === 'long') {
    options.weekday = format === 'full' ? 'long' : 'short';
  }
  
  return new Date(date).toLocaleDateString(undefined, options);
}

/**
 * Format a time string (HH:MM) to a more readable format
 * @param timeString Time string in format "HH:MM"
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTimeString(timeString: string): string {
  if (!timeString || !timeString.includes(':')) return timeString;
  
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr);
  
  if (isNaN(hour)) return timeString;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hour12}:${minuteStr} ${period}`;
}

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string if it exceeds the maximum length
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @param suffix Suffix to add to truncated strings (default: "...")
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
} 