import { useState, useEffect } from 'react';
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/localStorage';

/**
 * A custom React hook that synchronizes state with localStorage
 * 
 * @template T The type of the state
 * @param {string} key The key to use in localStorage
 * @param {T} initialValue The initial value if no value is found in localStorage
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, () => void]} 
 *   A tuple containing the state value, a setter function, and a reset function
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  // Initialize state with value from localStorage or fallback to initialValue
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      // Return initial value during server-side rendering
      return initialValue;
    }
    
    return getFromLocalStorage<T>(key, initialValue) as T;
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    saveToLocalStorage(key, state);
  }, [key, state]);

  // Function to reset state back to initial value
  const resetState = () => {
    setState(initialValue);
  };

  return [state, setState, resetState] as const;
}

export default useLocalStorageState; 