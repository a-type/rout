import { hooks } from '../gameClient';

export function usePitchingRotation(teamId: string) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[teamId];
  return team.pitchingOrder.map((playerId, index) => {
    return {
      player: finalState.league.playerLookup[playerId],
      isNext: index === team.nextPitcherIndex,
      index,
    };
  });
}
