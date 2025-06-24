import { Box, BoxProps, Button, clsx, Icon } from '@a-type/ui';
import { useViewport } from './ViewportContext';

export function ViewportZoomControls({ className, ...props }: BoxProps) {
  const viewport = useViewport();
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
    <Box
      surface
      gap
      className={clsx(
        'absolute top-sm right-sm flex-col sm:flex-row',
        className,
      )}
      {...props}
    >
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
