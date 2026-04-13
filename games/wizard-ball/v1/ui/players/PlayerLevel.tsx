import { getLevelFromXp } from '../../definition/index';
import { hooks } from '../gameClient.js';

export function PlayerLevel({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const { level } = getLevelFromXp(player.xp);
  return 'LVL ' + level;
}
