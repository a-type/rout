import { Box, clsx, useSizeCssVars, useStableCallback } from '@a-type/ui';
import {
  CSSProperties,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { ViewportContent } from './ViewportContent.js';
import { ViewportProvider } from './ViewportContext.js';
import { PositionOrPercentage, ViewportState } from './ViewportState.js';
import { useDndAutoPan } from './useDndAutoPan.js';
import {
  useKeyboardControls,
  useViewportGestureControls,
} from './useViewportGestures.js';

export interface ViewportProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  defaultCenter?: PositionOrPercentage;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: { x: number; y: number }) => void;
  /** Get access to the viewport from outside this component */
  viewportRef?: RefObject<ViewportState | null>;
  controlContent?: ReactNode;
}

export function Viewport({
  children,
  className,
  style,
  defaultCenter,
  onZoomChange,
  onCenterChange,
  viewportRef,
  controlContent,
}: ViewportProps) {
  const viewport = useState(
    () =>
      new ViewportState({
        panLimitMode: 'viewport',
        zoomLimits: {
          min: 'fit',
          max: 3,
        },
        defaultZoom: 0.5,
        panLimitBuffer: 100,
        defaultCenter,
      }),
  )[0];
  if (viewportRef) {
    // If a viewportRef is provided, we use it to expose the viewport state
    // This allows parent components to access the viewport state directly
    viewportRef.current = viewport;
  }

  const innerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useSizeCssVars<HTMLDivElement>(300, undefined, {
    width: '--root-width',
    height: '--root-height',
  });
  const finalRef = useMergedRef<HTMLDivElement>(
    viewport.bindRoot,
    innerRef,
    sizeRef,
  );

  const gestureProps = useViewportGestureControls(viewport, innerRef);
  const keyboardProps = useKeyboardControls(viewport);
  useDndAutoPan(viewport);

  useEffect(() => {
    (window as any).viewport = viewport; // For debugging purposes
  }, [viewport]);

  const stableOnZoomChange = useStableCallback(onZoomChange);
  const stableOnCenterChange = useStableCallback(onCenterChange);
  useEffect(() => {
    stableOnZoomChange(viewport.zoom);
    return viewport.subscribe('zoomChanged', stableOnZoomChange);
  }, [viewport, stableOnZoomChange]);
  useEffect(() => {
    stableOnCenterChange(viewport.center);
    return viewport.subscribe('centerChanged', stableOnCenterChange);
  }, [viewport, stableOnCenterChange]);

  return (
    <ViewportProvider value={viewport}>
      <Box className={className} style={style}>
        <div
          className={clsx(
            'w-full h-full flex-1 relative touch-none contain-strict select-none overflow-hidden',
            className,
          )}
          {...gestureProps}
          {...keyboardProps}
          ref={finalRef}
        >
          <ViewportContent viewport={viewport}>{children}</ViewportContent>
        </div>
      </Box>
      {controlContent}
    </ViewportProvider>
  );
}
