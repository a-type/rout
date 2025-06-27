import { Link } from 'react-router';
import { hooks } from '../gameClient';

export function TeamChip({ id, noRecord }: { id: string; noRecord?: boolean }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  return (
    <Link
      to={{
        search: `?teamId=${team.id}`,
      }}
      className="p1 inline-flex items-center gap-2 cursor-pointer hover:bg-gray/50 rounded"
    >
      {team.icon} {team.name} {!noRecord && `(${team.wins} - ${team.losses})`}
    </Link>
  );
}
