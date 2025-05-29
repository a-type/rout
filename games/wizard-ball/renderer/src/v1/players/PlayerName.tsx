import { hooks } from '../gameClient';

export function PlayerName({ id, bold }: { id: string; bold?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const playerName = player.name;
  if (bold) {
    return <span className="font-bold">{playerName}</span>;
  }
  return playerName;
}
