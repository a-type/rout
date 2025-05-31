import { hooks } from '../gameClient';

export function useBench(teamId: string) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[teamId];
  const bench = team.playerIds
    .map((pid) => {
      return finalState.league.playerLookup[pid] ?? null;
    })
    .filter(
      (p) =>
        p !== null &&
        !Object.values(team.positionChart).includes(p.id) &&
        !team.pitchingOrder.includes(p.id),
    );
  return bench;
}
