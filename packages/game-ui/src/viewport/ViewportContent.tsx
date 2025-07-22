import { clsx } from '@a-type/ui';
import { preventDefault } from '@a-type/utils';
import {
  HTMLMotionProps,
  motion,
  SpringOptions,
  useMotionTemplate,
  useSpring,
} from 'motion/react';
import { useEffect, useRef } from 'react';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { ViewportState } from './ViewportState.js';

export interface ViewportContentProps
  extends Omit<HTMLMotionProps<'div'>, 'viewport'> {
  viewport: ViewportState;
}

const PAN_SPRING_CONFIG: SpringOptions = {
  mass: 0.2,
  bounce: 0.05,
};
const ZOOM_SPRING_CONFIG: SpringOptions = {
  mass: 0.5,
  bounce: 0.1,
};

export function ViewportContent({
  viewport,
  children,
  className,
  ...rest
}: ViewportContentProps) {
  const internalRef = useRef<HTMLDivElement>(null);

  const centerX = useSpring(viewport.center.x, PAN_SPRING_CONFIG);
  const centerY = useSpring(viewport.center.y, PAN_SPRING_CONFIG);
  const zoom = useSpring(viewport.zoom, ZOOM_SPRING_CONFIG);

  useEffect(
    () =>
      viewport.subscribe('centerChanged', (center, origin) => {
        if (origin === 'direct') {
          centerX.jump(-center.x);
          centerY.jump(-center.y);
        } else {
          centerX.set(-center.x);
          centerY.set(-center.y);
        }
      }),
    [viewport, centerX, centerY],
  );
  useEffect(
    () =>
      viewport.subscribe('zoomChanged', (zoomValue, origin) => {
        if (origin === 'direct') {
          zoom.jump(zoomValue);
        } else {
          zoom.set(zoomValue);
        }
        if (internalRef.current) {
          internalRef.current.style.setProperty('--zoom', zoomValue.toString());
        }
      }),
    [viewport, zoom, internalRef],
  );

  useEffect(
    () =>
      viewport.subscribe('zoomSettled', (zoom) => {
        if (internalRef.current) {
          internalRef.current.style.setProperty(
            '--zoom-settled',
            zoom.toString(),
          );
        }
      }),
    [viewport, internalRef],
  );

  const finalRef = useMergedRef<HTMLDivElement>(
    viewport.bindContent,
    internalRef,
  );

  const transform = useMotionTemplate`translate3d(calc(var(--root-width,0)/2), calc(var(--root-height,0)/2), 0) translate3d(-50%, -50%, 0) scale(${zoom}) translate3d(${centerX}px, ${centerY}px, 0)`;

  return (
    <motion.div
      {...rest}
      className={clsx(
        'absolute overflow-visible overscroll-none touch-none transform-origin-center select-none',
        className,
      )}
      ref={finalRef}
      style={{ transform }}
      onDragStart={preventDefault}
      onDrag={preventDefault}
      onDragEnd={preventDefault}
    >
      {children}
    </motion.div>
  );
}
