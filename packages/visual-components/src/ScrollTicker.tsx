import { Box, clsx, useAnimationFrame } from '@a-type/ui';
import {
  Fragment,
  ReactNode,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

function useMediaQuery(query: string): boolean {
  const mediaQueryList = useMemo(() => window.matchMedia(query), [query]);

  return useSyncExternalStore(
    (cb) => {
      mediaQueryList.addEventListener('change', cb);
      return () => mediaQueryList.removeEventListener('change', cb);
    },
    () => mediaQueryList.matches,
  );
}

export function ScrollTicker({
  className,
  children,
  speed = 0.3,
  repeat = 50,
  ...props
}: {
  className?: string;
  children: ReactNode;
  speed?: number;
  repeat?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const reverse = useRef(false);
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  );

  const normalizedChildren =
    typeof children === 'string' ? <div>{children}</div> : children;

  const xRef = useRef(0);
  useAnimationFrame(() => {
    if (prefersReducedMotion) {
      return;
    }
    if (ref.current && parentRef.current) {
      const marquee = parentRef.current;
      const scrollWidth = marquee.scrollWidth;

      const content = ref.current;
      const contentWidth = content.clientWidth;

      const x = xRef.current;

      if (x + contentWidth >= scrollWidth) {
        reverse.current = true;
      }
      if (x <= 0) {
        reverse.current = false;
      }

      const delta = speed * (reverse.current ? -1 : 1);
      xRef.current = x + delta;
      content.style.setProperty('--x', `${-xRef.current}px`);
    }
  }, [ref.current, prefersReducedMotion, speed]);

  return (
    <div
      className={clsx('flex-1 overflow-hidden', className)}
      ref={parentRef}
      {...props}
    >
      <Box
        gap="sm"
        full="height"
        className="text-nowrap translate-x-[var(--x)]"
        items="center"
        ref={ref}
      >
        {new Array(repeat).fill(null).map((_, i) => (
          <Fragment key={i}>{normalizedChildren}</Fragment>
        ))}
      </Box>
    </div>
  );
}
