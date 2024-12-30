import { useCurrentTurn } from '@long-game/game-client/client';

export interface TurnErrorProps {}

export function TurnError({}: TurnErrorProps) {
  const { error } = useCurrentTurn();

  if (error) {
    return <span>{error}</span>;
  }

  return null;
}
