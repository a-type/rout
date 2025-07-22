import { isPitcher } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient.js';

export function useLineup(teamId: string) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[teamId];
  const lineup = team.battingOrder.map((position) => {
    const playerId = isPitcher(position)
      ? team.pitchingOrder[team.nextPitcherIndex]
      : (team.positionChart[position] ?? null);
    const player = playerId ? finalState.league.playerLookup[playerId] : null;
    return { position, player };
  });
  return lineup;
}
