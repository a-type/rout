import { Box, Button, clsx, Icon, useSizeCssVars } from '@a-type/ui';
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { useMergedRef } from '../hooks/useMergedRef';
import { ViewportContent } from './ViewportContent';
import { ViewportProvider } from './ViewportContext';
import { PositionOrPercentage, ViewportState } from './ViewportState';
import { useDndAutoPan } from './useDndAutoPan';
import {
  useKeyboardControls,
  useViewportGestureControls,
} from './useViewportGestures';

export interface ViewportProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  defaultCenter?: PositionOrPercentage;
}

export function Viewport({
  children,
  className,
  style,
  defaultCenter,
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
        <ZoomControls viewport={viewport} />
      </Box>
    </ViewportProvider>
  );
}

function ZoomControls({ viewport }: { viewport: ViewportState }) {
  const zoomIn = () => {
    viewport.setZoom(viewport.zoom * 1.3, {
      origin: 'control',
    });
  };
  const zoomOut = () => {
    viewport.setZoom(viewport.zoom / 1.3, {
      origin: 'control',
    });
  };
  const reset = () => {
    viewport.fitEverythingOnScreen({ origin: 'control' });
  };
  return (
    <Box surface gap className="absolute bottom-sm right-sm">
      <Button color="ghost" size="icon-small" onClick={reset}>
        <Icon name="maximize" />
      </Button>
      <Button color="ghost" size="icon-small" onClick={zoomIn}>
        <Icon name="zoomIn" />
      </Button>
      <Button color="ghost" size="icon-small" onClick={zoomOut}>
        <Icon name="zoomOut" />
      </Button>
    </Box>
  );
}
