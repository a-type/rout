import { hooks } from '../gameClient';
import { clsx, Tooltip } from '@a-type/ui';
import { TeamIcon } from '../teams/TeamIcon';
import { PlayerTooltipContent } from './PlayerTooltipContent';

export function PlayerChip({
  id,
  noBackground,
  noTeamIcon,
  noPositions,
}: {
  id: string;
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
      <span
        className={clsx(
          noBackground ? '' : 'p-1 bg-gray-800 hover:bg-gray-700',
          'inline-flex flex-row items-center gap-1 rounded cursor-pointer ',
        )}
      >
        {player.teamId && !noTeamIcon && (
          <TeamIcon id={player.teamId} size={16} />
        )}{' '}
        {player.name}{' '}
        {noPositions ? '' : <>({player.positions.join('/').toUpperCase()})</>}
      </span>
    </Tooltip>
  );
}
