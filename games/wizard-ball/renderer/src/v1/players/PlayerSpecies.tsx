import { speciesIcons } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';

export function PlayerSpecies({ id }: { id: string; bold?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  return speciesIcons[player.species];
}
