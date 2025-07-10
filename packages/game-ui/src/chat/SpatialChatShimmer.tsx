import { Box, BoxProps, clsx } from '@a-type/ui';
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
          'ring-2 ring-accent shadow-[0_0_4px_2px_var(--color-accent-light)]',
      )}
    >
      {children}
    </Box>
  );
}
