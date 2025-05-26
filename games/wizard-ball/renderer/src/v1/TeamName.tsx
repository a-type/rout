import { hooks } from './gameClient';

export function TeamName({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const teamName = team.name;
  return teamName;
}
