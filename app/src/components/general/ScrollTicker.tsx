import { Box, useAnimationFrame } from '@a-type/ui';
import { useMediaQuery } from '@long-game/game-ui';
import { Fragment, ReactNode, useRef } from 'react';

export function ScrollTicker({
  className,
  children,
  speed = 0.3,
  ...props
}: {
  className?: string;
  children: ReactNode;
  speed?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const reverse = useRef(false);
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  );

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
    <div className="flex-1 overflow-hidden" ref={parentRef} {...props}>
      <Box
        gap="sm"
        full="height"
        className="text-nowrap translate-x-[var(--x)]"
        items="center"
        ref={ref}
      >
        {new Array(30).fill(null).map((_, i) => (
          <Fragment key={i}>{children}</Fragment>
        ))}
      </Box>
    </div>
  );
}
