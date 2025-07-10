import { Box, BoxProps, clsx } from '@a-type/ui';
import { TopographyBackground } from '@long-game/visual-components';
import { useDndStore } from '../dnd/dndStore';

export interface SpatialChatShimmerProps extends BoxProps {}

export function SpatialChatShimmer({
  className,
  children,
  ...rest
}: SpatialChatShimmerProps) {
  const isSpatialChatDragging = useDndStore(
    (state) => state.dragging === 'spatial-chat',
  );
  return (
    <Box
      {...rest}
      className={clsx(
        isSpatialChatDragging &&
          'ring-2 ring-accent shadow-[0_0_48px_12px_var(--color-accent-light)]',
      )}
    >
      {children}
      {isSpatialChatDragging && (
        <TopographyBackground className="absolute inset-0 z-1 pointer-events-none opacity-20 transition-opacity" />
      )}
    </Box>
  );
}
