import { hooks } from './gameClient';

export function useGameResults({ id }: { id: string }) {
  const { finalState, getRound } = hooks.useGameSuite();
  const round = finalState.league.schedule.findIndex((i) =>
    i.some((g) => g.id === id),
  );
  const gameResult = getRound(round + 1)
    .initialPlayerState.league.gameResults.flat()
    .find((game) => game.id === id);
  return gameResult ?? null;
}
