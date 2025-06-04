import { clsx } from '@a-type/ui';
import { hooks } from '../gameClient';

export function TeamName({ id, bold }: { id: string; bold?: boolean }) {
  const { finalState, players } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const teamName = team.name;
  return (
    <span
      className={clsx(bold && 'font-bold')}
      style={{
        color: team.ownerId ? players[team.ownerId].color : 'inherit',
      }}
    >
      {teamName}
    </span>
  );
}
