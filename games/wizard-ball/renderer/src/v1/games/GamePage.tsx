import { hooks } from '../gameClient';
import { Tabs } from '@a-type/ui';
import { useState } from 'react';
import { GameLog } from './GameLog';
import { GameBoxScore } from './GameBoxScore';
import { useGameResults } from '../useGameResults';
import { WeatherChip } from '../WeatherChip';

export function GamePage({ id }: { id: string }) {
  const [tab, setTab] = useState<'boxScore' | 'gameLog'>('boxScore');
  const { finalState } = hooks.useGameSuite();
  const game = useGameResults({ id });
  if (!game) {
    return <div>Game not found</div>;
  }
  const homeTeam = finalState.league.teamLookup[game.homeTeamId];
  const awayTeam = finalState.league.teamLookup[game.awayTeamId];
  const homeTeamScore = game.score[game.homeTeamId];
  const awayTeamScore = game.score[game.awayTeamId];
  return (
    <Tabs
      value={tab}
      onValueChange={(tab) => {
        setTab(tab as any);
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="mb-0">
          {homeTeamScore > awayTeamScore ? (
            <>
              {homeTeam.name} {homeTeamScore}, {awayTeam.name} {awayTeamScore}
            </>
          ) : (
            <>
              {awayTeam.name} {awayTeamScore}, {homeTeam.name} {homeTeamScore}
            </>
          )}
        </h1>
        <div className="flex flex-row gap-2 items-center mb-2">
          <Tabs.List className="mb-0">
            <Tabs.Trigger value="boxScore" className="p-1">
              Box Score
            </Tabs.Trigger>
            <Tabs.Trigger value="gameLog" className="p-1">
              Game Log
            </Tabs.Trigger>
          </Tabs.List>
          <div className="ml-auto my-auto">
            <WeatherChip id={game.weather} />
          </div>
        </div>
        {tab === 'boxScore' && <GameBoxScore id={id} />}
        {tab === 'gameLog' && <GameLog id={id} />}
      </div>
    </Tabs>
  );
}
