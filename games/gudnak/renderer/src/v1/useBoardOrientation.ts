import { useMediaQuery } from '@long-game/game-ui';

export function useBoardOrientation() {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  return isLarge ? 'landscape' : 'portrait';
}
