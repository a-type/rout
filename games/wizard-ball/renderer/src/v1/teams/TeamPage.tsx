import { clsx, Tabs } from '@a-type/ui';
import {
  getTeamAvgAttributes,
  type Team,
  type TeamId,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { useState } from 'react';
import { Attributes } from '../ratings/Attributes';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { TeamLineup } from './TeamLineup';
import { TeamChart } from './TeamChart';
import { TeamItems } from './TeamItems';
import { BallparkChip } from '../BallparkChip';
import { Link } from 'react-router';
import { TeamPlayers } from './TeamPlayers';

const tabOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'battingOrder', label: 'Batting Order' },
  { value: 'depthChart', label: 'Depth Chart' },
  { value: 'players', label: 'Players' },
  { value: 'items', label: 'Items' },
  { value: 'games', label: 'Games' },
] as const satisfies Array<{ label: string; value: string }>;

type TabValue = (typeof tabOptions)[number]['value'];

export function TeamPage({ id }: { id: TeamId }) {
  const [view, setView] = useState<TabValue>('summary');
  const { finalState, players } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id] as Team;
  const schedule = finalState.league.schedule;
  const mySchedule = schedule.flatMap((r) =>
    r.filter((g) => g.awayTeamId === id || g.homeTeamId === id),
  );

  const myGameResults = finalState.league.gameResults
    .flat()
    .filter((game) => game.winner === id || game.loser === id);

  const teamAttributes = getTeamAvgAttributes(finalState.league, team.id);

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as any)}>
      <div className="flex flex-col p-2">
        <div className="flex flex-row items-center gap-2 mb-2">
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
                'text-xs border-none rounded-none min-w-[1rem] bg-gray-700 hover:bg-gray-500 ring-0',
              )}
            >
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="summary">
          <Attributes attributes={teamAttributes} />
        </Tabs.Content>
        <Tabs.Content value="battingOrder">
          <TeamLineup id={id} />
        </Tabs.Content>
        <Tabs.Content value="depthChart">
          <TeamChart id={id} />
        </Tabs.Content>
        <Tabs.Content value="items">
          <TeamItems id={id} />
        </Tabs.Content>
        <Tabs.Content value="players">
          <TeamPlayers id={id} />
        </Tabs.Content>
        <Tabs.Content value="games">
          <div>
            <h3 className="mt-4">Games</h3>
            <div className="flex flex-col">
              {mySchedule.map((game, index) => {
                if (!myGameResults[index]) {
                  const homeTeam =
                    finalState.league.teamLookup[game.homeTeamId];
                  const awayTeam =
                    finalState.league.teamLookup[game.awayTeamId];
                  const location = game.homeTeamId === id ? 'Home' : 'Away';
                  const opponent = game.homeTeamId === id ? awayTeam : homeTeam;
                  return (
                    <div key={index} className="text-sm">
                      {location} vs {opponent.name}
                    </div>
                  );
                }
                const {
                  winner,
                  loser,
                  score: gameScore,
                } = myGameResults[index];
                // Format the game result as either WIN or LOSS vs opponent with score in parentheses
                const win = winner === id;
                const opponentId = winner === id ? loser : winner;
                const opponent = finalState.league.teamLookup[opponentId];
                const score = gameScore[id] + ' - ' + gameScore[opponentId];
                const home = game.homeTeamId === id;
                const gameResult = win ? 'WIN' : 'LOSS';
                const location = home ? 'home' : 'away';
                const result = `${gameResult} (${location}) vs ${opponent.name} (${score})`;
                return (
                  <Link
                    to={{ search: '?gameId=' + game.id }}
                    key={index}
                    className={clsx(
                      'text-sm cursor-pointer hover:bg-gray-700',
                      win ? 'text-green-500' : 'text-red-500',
                    )}
                  >
                    {result}
                  </Link>
                );
              })}
            </div>
          </div>
        </Tabs.Content>
      </div>
    </Tabs>
  );
}
