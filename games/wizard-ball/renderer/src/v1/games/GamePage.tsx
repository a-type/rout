import { hooks } from '../gameClient';
import { Tabs } from '@a-type/ui';
import { useState } from 'react';
import { GameLog } from './GameLog';
import { GameBoxScore } from './GameBoxScore';

export function GamePage({ id }: { id: string }) {
  const [tab, setTab] = useState<'boxScore' | 'gameLog'>('boxScore');
  const { finalState } = hooks.useGameSuite();
  const game = finalState.league.gameResults
    .flat()
    .find((game) => game.id === id);
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
        <Tabs.List className="mb-2">
          <Tabs.Trigger value="boxScore" className="p-1">
            Box Score
          </Tabs.Trigger>
          <Tabs.Trigger value="gameLog" className="p-1">
            Game Log
          </Tabs.Trigger>
        </Tabs.List>
        {tab === 'boxScore' && <GameBoxScore id={id} />}
        {tab === 'gameLog' && <GameLog id={id} />}
      </div>
    </Tabs>
  );
}
