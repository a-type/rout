import { clsx, Tooltip } from '@a-type/ui';
import { Link } from 'react-router';
import { hooks } from '../gameClient';
import { TeamIcon } from '../teams/TeamIcon';
import { PlayerClass } from './PlayerClass';
import { PlayerSpecies } from './PlayerSpecies';
import { PlayerStatus } from './PlayerStatus';
import { PlayerTooltipContent } from './PlayerTooltipContent';

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
    return <span className="color-attention-dark">Unknown Player</span>;
  }
  return (
    <Tooltip
      className="bg-gray-wash color-gray-ink"
      content={<PlayerTooltipContent id={id} />}
    >
      <Link to={{ search: '?playerId=' + id }}>
        <span
          className={clsx(
            noBackground ? '' : 'p-1 bg-white hover:bg-gray-wash',
            'inline-flex flex-row items-center gap-0 rounded cursor-pointer ',
          )}
        >
          {!noTeamIcon &&
            (player.teamId ? (
              <TeamIcon id={player.teamId} size={16} />
            ) : (
              <span className="color-gray-dark">FA</span>
            ))}{' '}
          {includeSpecies && <PlayerSpecies id={player.id} />}
          {includeClass && <PlayerClass id={player.id} />}
          <PlayerStatus id={player.id} />
          {player.name}{' '}
          {noPositions ? '' : <>({player.positions.join('/').toUpperCase()})</>}
        </span>
      </Link>
    </Tooltip>
  );
}
