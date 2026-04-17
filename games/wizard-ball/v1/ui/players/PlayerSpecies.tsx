import { speciesIcons } from '../../definition/index';
import { hooks } from '../gameClient.js';

export function PlayerSpecies({ id }: { id: string; bold?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  return speciesIcons[player.species];
}
