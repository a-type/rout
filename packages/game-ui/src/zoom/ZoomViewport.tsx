import {
  Canvas,
  CanvasRoot,
  useCreateCanvas,
  useCreateViewport,
  Viewport,
  ViewportConfig,
  ViewportRoot,
} from '@a-type/react-space';
import { Box, Button, Icon } from '@a-type/ui';
import { ReactNode } from 'react';

export interface ZoomViewportProps {
  className?: string;
  config?: ViewportConfig;
  children?: ReactNode;
}

export function ZoomViewport({
  className,
  config,
  children,
}: ZoomViewportProps) {
  const viewport = useCreateViewport(config);
  const canvas = useCreateCanvas({
    viewport,
    autoUpdateViewport: true,
  });

  return (
    <Box className={className}>
      <ViewportRoot viewport={viewport} className="absolute inset-0">
        <CanvasRoot canvas={canvas}>{children}</CanvasRoot>
      </ViewportRoot>
      <ZoomControls viewport={viewport} canvas={canvas} />
    </Box>
  );
}

function ZoomControls({
  viewport,
  canvas,
}: {
  viewport: Viewport;
  canvas: Canvas;
}) {
  const zoomIn = () => {
    viewport.zoom(viewport.zoomValue * 1.2);
  };
  const zoomOut = () => {
    viewport.zoom(viewport.zoomValue / 1.2);
  };
  const reset = () => {
    viewport.fitOnScreen(canvas.bounds.getGlobal());
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
