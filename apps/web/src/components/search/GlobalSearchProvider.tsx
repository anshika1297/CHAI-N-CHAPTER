'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

type SearchContextValue = {
  registerSearchInput: (el: HTMLInputElement | null) => void;
  focusSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useGlobalSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    return {
      registerSearchInput: () => {},
      focusSearch: () => {},
    };
  }
  return ctx;
}

export default function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
  }, []);

  const focusSearch = useCallback(() => {
    const registered = inputRef.current;
    const visible =
      registered && registered.getClientRects().length > 0
        ? registered
        : document.querySelector<HTMLInputElement>('input[aria-label="Search site"]');
    if (!visible) return;
    visible.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    visible.focus();
    visible.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusSearch]);

  return (
    <SearchContext.Provider value={{ registerSearchInput, focusSearch }}>
      {children}
    </SearchContext.Provider>
  );
}
