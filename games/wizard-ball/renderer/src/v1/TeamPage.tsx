import { clsx, Tabs } from '@a-type/ui';
import type { Team, TeamId } from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';
import { Attributes } from './Attributes';

const tabOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'players', label: 'Players' },
  { value: 'games', label: 'Games' },
] as const satisfies Array<{ label: string; value: string }>;

export function TeamPage({ id }: { id: TeamId }) {
  const [view, setView] = useState<'summary' | 'players' | 'games'>('summary');
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id] as Team;
  const [, setSearchParams] = useSearchParams();
  const schedule = finalState.league.schedule;
  const mySchedule = schedule.flatMap((r) =>
    r.filter((g) => g.awayTeamId === id || g.homeTeamId === id),
  );
  const myGameResults = finalState.league.gameResults.flatMap((round) =>
    round.filter((r) => r.winner === id || r.loser === id),
  );

  const renderColorCell = (value: number, max: number = 20) => {
    // Clamp value between 1 and max
    const v = Math.max(1, Math.min(value, max));
    // Calculate percentage (0 = red, 0.5 = yellow, 1 = green)
    const percent = (v - 1) / (max - 1);
    // Interpolate color: red (255,0,0) -> yellow (255,255,0) -> green (0,200,0)
    let r, g, b;
    if (percent < 0.5) {
      // red to yellow
      r = 255;
      g = Math.round(255 * (percent / 0.5));
      b = 0;
    } else {
      // yellow to green
      r = Math.round(255 * (1 - (percent - 0.5) / 0.5));
      g = 200;
      b = 0;
    }
    const bg = `rgb(${r},${g},${b}, .8)`;
    return (
      <td
        className="text-center"
        style={{ backgroundColor: bg, color: '#222' }}
      >
        {value}
      </td>
    );
  };

  const teamAttributes = team.playerIds
    .map((playerId) => {
      const player = finalState.league.playerLookup[playerId];
      const overall = Object.values(player.attributes).reduce((a, b) => a + b);
      return { ...player.attributes, overall };
    })
    .map((attributes, idx, arr) => {
      // divide attributes by number of players
      return {
        strength: attributes.strength / arr.length,
        agility: attributes.agility / arr.length,
        constitution: attributes.constitution / arr.length,
        wisdom: attributes.wisdom / arr.length,
        intelligence: attributes.intelligence / arr.length,
        charisma: attributes.charisma / arr.length,
        overall: attributes.overall / arr.length,
      };
    })
    .reduce((a, b) => {
      return {
        strength: a.strength + b.strength,
        agility: a.agility + b.agility,
        constitution: a.constitution + b.constitution,
        wisdom: a.wisdom + b.wisdom,
        intelligence: a.intelligence + b.intelligence,
        charisma: a.charisma + b.charisma,
        overall: a.overall + b.overall,
      };
    });

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as any)}>
      <div className="flex flex-col p-2">
        <h2 className="flex items-center gap-2">
          <span style={{ fontSize: 64 }}>{team.icon}</span> {team.name} (
          {team.wins} - {team.losses})
        </h2>
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
        <Tabs.Content value="players">
          <div>
            <h3 className="mt-4">Players</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-1">Name</th>
                  <th className="text-left p-1">Position</th>
                  <th className="text-center p-1">OVR</th>
                  <th className="text-center p-1">STR</th>
                  <th className="text-center p-1">AGI</th>
                  <th className="text-center p-1">CON</th>
                  <th className="text-center p-1">WIS</th>
                  <th className="text-center p-1">INT</th>
                  <th className="text-center p-1">CHA</th>
                </tr>
              </thead>
              <tbody>
                {team.playerIds
                  .map((playerId) => {
                    const player = finalState.league.playerLookup[playerId];
                    const overall = Object.values(player.attributes).reduce(
                      (a, b) => a + b,
                    );
                    return { player, overall };
                  })
                  .sort((a, b) => b.overall - a.overall)
                  .map(({ player, overall }) => {
                    return (
                      <tr
                        key={player.id}
                        className="cursor-pointer hover:bg-gray-700"
                        onClick={() => {
                          setSearchParams((params) => {
                            params.delete('teamId');
                            params.set('playerId', player.id);
                            return params;
                          });
                        }}
                      >
                        <td className="p-1">{player.name}</td>
                        <td className="p-1">
                          {player.positions[0].toUpperCase()}
                        </td>
                        {renderColorCell(overall, 100)}
                        {renderColorCell(player.attributes.strength)}
                        {renderColorCell(player.attributes.agility)}
                        {renderColorCell(player.attributes.constitution)}
                        {renderColorCell(player.attributes.wisdom)}
                        {renderColorCell(player.attributes.intelligence)}
                        {renderColorCell(player.attributes.charisma)}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
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
                  <div
                    key={index}
                    className={clsx(
                      'text-sm cursor-pointer hover:bg-gray-700',
                      win ? 'text-green-500' : 'text-red-500',
                    )}
                    onClick={() => {
                      setSearchParams((params) => {
                        params.delete('teamId');
                        params.set('gameId', game.id);
                        return params;
                      });
                    }}
                  >
                    {result}
                  </div>
                );
              })}
            </div>
          </div>
        </Tabs.Content>
      </div>
    </Tabs>
  );
}
