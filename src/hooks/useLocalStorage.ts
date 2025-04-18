import { useState, useEffect } from "react";

/**
 * A React hook that persists state to localStorage.
 * @template T
 * @param {string} key The localStorage key.
 * @param {T} defaultValue The default value if no stored value exists.
 * @returns {[T, import("react").Dispatch<import("react").SetStateAction<T>>]} A stateful value and a setter function.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (state === defaultValue) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // Ignore storage errors
    }
  }, [key, state, defaultValue]);

  return [state, setState] as const;
}
