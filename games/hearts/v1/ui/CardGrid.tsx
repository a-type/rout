import { Box, BoxProps, clsx } from '@a-type/ui';
import { TokenPresence } from '@long-game/game-ui';
import cls from './CardGrid.module.css';

export interface CardGridProps extends BoxProps {}

export function CardGrid({ children, className, ...rest }: CardGridProps) {
  return (
    <Box
      gap
      full
      layout="center center"
      className={clsx(cls.root, className)}
      {...rest}
    >
      <TokenPresence>{children}</TokenPresence>
    </Box>
  );
}
