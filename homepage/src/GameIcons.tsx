import { Box, useAnimationFrame } from '@a-type/ui';
import { Children, useEffect, useRef } from 'react';

export interface GameIconsProps {}

export function GameIcons({}: GameIconsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const repeat = 3;

  const children = new Array(6).fill(0).map((_, i) => (
    <Box
      surface="wash"
      border
      className="aspect-1 w-200px flex-shrink-0 color-gray-dark"
      key={i}
      layout="center center"
    >
      Game Coming Someday
    </Box>
  ));

  const innerWidth = useRef(0);
  useEffect(() => {
    const inner = innerRef.current!;

    const w = inner.getBoundingClientRect().width;
    inner.style.setProperty('--width', w + 'px');
    innerWidth.current = w;
  }, []);

  const offset = useRef(0);
  useAnimationFrame(() => {
    offset.current -= 0.3;
    if (offset.current < -innerWidth.current / repeat) {
      offset.current += innerWidth.current / repeat;
    }
    innerRef.current!.style.setProperty(
      'transform',
      `translateX(${offset.current}px)`,
    );
  });

  return (
    <div
      ref={rootRef}
      className="w-full overflow-hidden relative flex-shrink-0"
    >
      <div
        ref={innerRef}
        className="w-min-content flex-shrink-0 overflow-x-visible flex flex-row gap-lg items-center relative"
      >
        {new Array(repeat).fill(null).map((_, i) =>
          Children.map(children, (child, index) => (
            <div
              className="flex-shrink-0 relative"
              data-index={index}
              key={`${index}-${i}`}
              style={{
                transform: `translateX(calc(var(--width, 0px) * var(--mult, 0)))`,
              }}
            >
              {child}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
