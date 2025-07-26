import { useGame } from '@/hooks/useGame';

export interface GameTitleProps {
  gameId: string;
}

export function GameTitle({ gameId }: GameTitleProps) {
  const game = useGame(gameId);

  return <>{game.title}</>;
}
