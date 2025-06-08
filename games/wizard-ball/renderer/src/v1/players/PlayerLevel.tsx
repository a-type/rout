import { getLevelFromXp } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';

export function PlayerLevel({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const level = getLevelFromXp(player.xp);
  return 'LVL ' + level;
}
