import { useEffect, useState } from 'react';

/**
 * A small useState-like hook that persists its value to localStorage.
 * Safe for SSR/build environments (falls back to the initial value).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (e.g. storage full or unavailable)
    }
  }, [key, value]);

  return [value, setValue] as const;
}
