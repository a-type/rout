import { isPitcher } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient.js';

export function usePitchingRelievers(teamId: string) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[teamId];
  return team.playerIds
    .filter((p) => !team.pitchingOrder.includes(p))
    .filter((p) =>
      finalState.league.playerLookup[p].positions.some((p) => isPitcher(p)),
    )
    .map((playerId) => {
      return finalState.league.playerLookup[playerId];
    });
}
