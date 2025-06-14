import { Box, BoxProps, clsx } from '@a-type/ui';
import { TokenPresence } from '@long-game/game-ui';

export interface CardGridProps extends BoxProps {}

export function CardGrid({ children, className, ...rest }: CardGridProps) {
  return (
    <Box
      gap
      full
      layout="center center"
      className={clsx(
        'grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] [grid-auto-rows:auto]',
        className,
      )}
      {...rest}
    >
      <TokenPresence>{children}</TokenPresence>
    </Box>
  );
}
