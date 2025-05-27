import { hooks } from './gameClient';

export function TeamName({ id, bold }: { id: string; bold?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const teamName = team.name;
  if (bold) {
    return <span className="font-bold">{teamName}</span>;
  }
  return teamName;
}
