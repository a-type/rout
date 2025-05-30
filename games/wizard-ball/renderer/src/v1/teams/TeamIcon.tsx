import { hooks } from '../gameClient';

export function TeamIcon({ id, size = 32 }: { id: string; size?: number }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const teamIcon = team.icon;
  return <div style={{ fontSize: size }}>{teamIcon}</div>;
}
