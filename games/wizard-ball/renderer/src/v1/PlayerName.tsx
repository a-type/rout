import { hooks } from './gameClient';

export function PlayerName({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const playerName = player.name;
  return playerName;
}
