import { clsx, Tabs } from '@a-type/ui';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { type TeamId } from '@long-game/game-wizard-ball-definition';
import { useSearchParams } from 'react-router';
import { BallparkChip } from '../BallparkChip';
import { hooks } from '../gameClient';
import { TeamChart } from './TeamChart';
import { TeamItems } from './TeamItems';
import { TeamLineup } from './TeamLineup';
import { TeamPlayers } from './TeamPlayers';
import { TeamSchedule } from './TeamSchedule';
import { TeamSummary } from './TeamSummary';

const tabOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'battingOrder', label: 'Batting Order' },
  { value: 'depthChart', label: 'Depth Chart' },
  { value: 'players', label: 'Players' },
  { value: 'items', label: 'Items' },
  { value: 'games', label: 'Games' },
] as const satisfies Array<{ label: string; value: string }>;

export function TeamPage({ id }: { id: TeamId }) {
  const [params, setParams] = useSearchParams();
  const { finalState, players } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];

  return (
    <Tabs
      value={params.get('view') ?? 'summary'}
      onValueChange={(v) => {
        setParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('view', v);
          return newParams;
        });
      }}
    >
      <div className="flex flex-col p-2">
        <div className="flex flex-row items-center gap-2 mb-2 flex-wrap">
          <h2
            className="flex items-center gap-2 mb-0"
            style={{
              color: team.ownerId ? players[team.ownerId].color : 'inherit',
            }}
          >
            <span style={{ fontSize: 64 }}>{team.icon}</span> {team.name} (
            {team.wins} - {team.losses})
          </h2>
          <div>
            <BallparkChip id={team.ballpark} />
          </div>
          <div className="flex items-center gap-3 ml-auto mr-8">
            Owner:{' '}
            {team.ownerId ? (
              <span className="flex items-center gap-1">
                <PlayerAvatar playerId={team.ownerId} />
                <PlayerName playerId={team.ownerId} />
              </span>
            ) : (
              <span className="flex items-center gap-1">🤖 CPU</span>
            )}
          </div>
        </div>

        <Tabs.List className="gap-none">
          {tabOptions.map((option, idx, arr) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value}
              className={clsx(
                idx == 0 && 'rounded-l-lg',
                idx == arr.length - 1 && 'rounded-r-lg',
                'text-xs border-none rounded-none min-w-[1rem] bg-gray-wash hover:bg-gray ring-0',
              )}
            >
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="summary">
          <TeamSummary id={id} />
        </Tabs.Content>
        <Tabs.Content value="battingOrder">
          <TeamLineup id={id} />
        </Tabs.Content>
        <Tabs.Content value="depthChart">
          <TeamChart id={id} key={id} />
        </Tabs.Content>
        <Tabs.Content value="items">
          <TeamItems id={id} />
        </Tabs.Content>
        <Tabs.Content value="players">
          <TeamPlayers id={id} />
        </Tabs.Content>
        <Tabs.Content value="games">
          <TeamSchedule id={id} />
        </Tabs.Content>
      </div>
    </Tabs>
  );
}
