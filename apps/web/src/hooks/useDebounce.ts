import { useState, useEffect } from 'react';

/**
 * Returns a debounced value that updates only after `delay` ms have passed
 * since the last change. Use for keyword inputs (author, title, book) so
 * the API is not hit on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
