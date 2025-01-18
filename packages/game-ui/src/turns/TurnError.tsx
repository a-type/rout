import { useGameSuite, withGame } from '@long-game/game-client';

export interface TurnErrorProps {}

export const TurnError = withGame(function TurnError({}: TurnErrorProps) {
  const suite = useGameSuite();

  if (suite.turnError) {
    return <span>{suite.turnError}</span>;
  }

  return null;
});
