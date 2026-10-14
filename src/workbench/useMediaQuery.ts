import { useSyncExternalStore } from 'react';

const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** Tracks a CSS media query. False where `matchMedia` is unavailable, such as tests. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (!supported) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => (supported ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Below this width the workbench collapses its side columns. */
export const compactQuery = '(max-width: 900px)';
