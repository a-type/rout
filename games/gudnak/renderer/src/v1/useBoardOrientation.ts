import { useMediaQuery } from '@long-game/game-ui';

export function useBoardOrientation() {
  const isLarge = useMediaQuery('(min-width: 768px)');
  return isLarge ? 'landscape' : 'portrait';
}
