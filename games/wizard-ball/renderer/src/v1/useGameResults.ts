import { hooks } from './gameClient';

export function useGameResults({ id }: { id: string }) {
  const { finalState, getRound, latestRoundIndex } = hooks.useGameSuite();
  const round = finalState.league.schedule.findIndex((i) =>
    i.some((g) => g.id === id),
  );
  if (round === -1 || round >= latestRoundIndex) {
    return null;
  }
  const gameResult = getRound(round + 1)
    .initialPlayerState.league.gameResults.flat()
    .find((game) => game.id === id);
  return gameResult ?? null;
}
