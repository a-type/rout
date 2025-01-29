import { useMemo, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const mediaQueryList = useMemo(() => window.matchMedia(query), [query]);

  return useSyncExternalStore(
    (cb) => {
      mediaQueryList.addEventListener('change', cb);
      return () => mediaQueryList.removeEventListener('change', cb);
    },
    () => mediaQueryList.matches,
  );
}
