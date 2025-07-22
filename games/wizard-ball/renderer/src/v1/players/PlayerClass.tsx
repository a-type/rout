import { classIcons } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient.js';

export function PlayerClass({ id }: { id: string; bold?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  return classIcons[player.class];
}
