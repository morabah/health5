/**
 * Local Storage utility functions for the health appointment system
 * These functions provide a convenient way to interact with localStorage
 */

// Prefix to avoid conflicts with other applications
const APP_PREFIX = 'health_app_';

/**
 * Save data to localStorage with proper error handling
 * @param key The key to save under (will be prefixed)
 * @param data The data to save
 * @returns boolean indicating success
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    const prefixedKey = `${APP_PREFIX}${key}`;
    localStorage.setItem(prefixedKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Retrieve data from localStorage with proper error handling
 * @param key The key to retrieve (will be prefixed)
 * @param defaultValue Optional default value if nothing is found
 * @returns The retrieved data or default value
 */
export function getFromLocalStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const prefixedKey = `${APP_PREFIX}${key}`;
    const storedValue = localStorage.getItem(prefixedKey);
    
    if (storedValue === null) {
      return defaultValue;
    }
    
    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.error(`Error getting from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage with proper error handling
 * @param key The key to remove (will be prefixed)
 * @returns boolean indicating success
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    const prefixedKey = `${APP_PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Save form responses to localStorage
 * @param formId Unique identifier for the form
 * @param responses The responses to save
 * @returns boolean indicating success
 */
export function saveFormResponses<T>(formId: string, responses: T): boolean {
  return saveToLocalStorage(`form_${formId}`, responses);
}

/**
 * Get form responses from localStorage
 * @param formId Unique identifier for the form
 * @returns The stored responses or undefined if not found
 */
export function getFormResponses<T>(formId: string): T | undefined {
  return getFromLocalStorage<T>(`form_${formId}`);
}

/**
 * Clear form responses from localStorage
 * @param formId Unique identifier for the form
 * @returns boolean indicating success
 */
export function clearFormResponses(formId: string): boolean {
  return removeFromLocalStorage(`form_${formId}`);
}

/**
 * Save user preferences to localStorage
 * @param userId User identifier
 * @param preferences The preferences to save
 * @returns boolean indicating success
 */
export function saveUserPreferences<T>(userId: string, preferences: T): boolean {
  return saveToLocalStorage(`user_prefs_${userId}`, preferences);
}

/**
 * Get user preferences from localStorage
 * @param userId User identifier
 * @returns The stored preferences or undefined if not found
 */
export function getUserPreferences<T>(userId: string): T | undefined {
  return getFromLocalStorage<T>(`user_prefs_${userId}`);
} 