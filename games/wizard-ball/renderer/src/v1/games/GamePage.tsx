import { Tabs, TabsContent } from '@a-type/ui';
import { useTransition } from 'react';
import { useSearchParams } from 'react-router';
import { BallparkChip } from '../BallparkChip';
import { hooks } from '../gameClient';
import { useGameResults } from '../useGameResults';
import { WeatherChip } from '../WeatherChip';
import { GameBoxScore } from './GameBoxScore';
import { GameLog } from './GameLog';
import { GameSummary } from './GameSummary';
import { ScheduledGamePage } from './ScheduledGamePage';

export function GamePage({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { finalState } = hooks.useGameSuite();
  const game = useGameResults({ id });
  if (!game) {
    const scheduledGame = finalState.league.schedule
      .flat()
      .find((g) => g.id === id);
    if (!scheduledGame) {
      return <div>Game not found</div>;
    }
    return <ScheduledGamePage id={scheduledGame.id} />;
  }
  const homeTeam = finalState.league.teamLookup[game.homeTeamId];
  const awayTeam = finalState.league.teamLookup[game.awayTeamId];
  const homeTeamScore = game.score[game.homeTeamId];
  const awayTeamScore = game.score[game.awayTeamId];
  return (
    <Tabs
      value={params.get('view') || 'summary'}
      onValueChange={(tab) => {
        startTransition(() => {
          setParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
          });
        });
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
            <Tabs.Trigger value="summary" className="p-1">
              Summary
            </Tabs.Trigger>
            <Tabs.Trigger value="boxScore" className="p-1">
              Box Score
            </Tabs.Trigger>
            <Tabs.Trigger value="gameLog" className="p-1">
              Game Log
            </Tabs.Trigger>
          </Tabs.List>
          <div className="ml-auto my-auto flex flex-row gap-2">
            <BallparkChip id={game.ballpark} />
            <WeatherChip id={game.weather} />
          </div>
        </div>
        {isPending ? (
          <div className="color-gray-dark">Loading...</div>
        ) : (
          <>
            <TabsContent value="summary">
              <GameSummary id={id} />
            </TabsContent>
            <TabsContent value="boxScore">
              <GameBoxScore id={id} />
            </TabsContent>
            <TabsContent value="gameLog">
              <GameLog id={id} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
}
