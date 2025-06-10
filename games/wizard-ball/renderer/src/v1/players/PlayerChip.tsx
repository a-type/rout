import { hooks } from '../gameClient';
import { clsx, Tooltip } from '@a-type/ui';
import { TeamIcon } from '../teams/TeamIcon';
import { PlayerTooltipContent } from './PlayerTooltipContent';
import { Link } from 'react-router';
import { PlayerSpecies } from './PlayerSpecies';
import { PlayerClass } from './PlayerClass';

export function PlayerChip({
  id,
  includeSpecies,
  includeClass,
  noBackground,
  noTeamIcon,
  noPositions,
}: {
  id: string;
  includeSpecies?: boolean;
  includeClass?: boolean;
  noBackground?: boolean;
  noTeamIcon?: boolean;
  noPositions?: boolean;
}) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <span className="text-red-500">Unknown Player</span>;
  }
  return (
    <Tooltip
      className="bg-gray-700 text-gray-100"
      content={<PlayerTooltipContent id={id} />}
    >
      <Link to={{ search: '?playerId=' + id }}>
        <span
          className={clsx(
            noBackground ? '' : 'p-1 bg-gray-800 hover:bg-gray-700',
            'inline-flex flex-row items-center gap-1 rounded cursor-pointer ',
          )}
        >
          {player.teamId && !noTeamIcon && (
            <TeamIcon id={player.teamId} size={16} />
          )}{' '}
          {includeSpecies && <PlayerSpecies id={player.id} />}
          {includeClass && <PlayerClass id={player.id} />}
          {player.name}{' '}
          {noPositions ? '' : <>({player.positions.join('/').toUpperCase()})</>}
        </span>
      </Link>
    </Tooltip>
  );
}
