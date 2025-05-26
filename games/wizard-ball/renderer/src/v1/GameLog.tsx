import type { GameLogEvent } from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { TeamName } from './TeamName';
import { PlayerName } from './PlayerName';
import { getInningInfo } from '@long-game/game-wizard-ball-definition';
import { capitalize, nthToString } from './utils';

export function GameLogEvent({ event }: { event: GameLogEvent }) {
  switch (event.kind) {
    case 'inningStart':
      const { inning, half } = getInningInfo(event.inning);
      const pitchingScore = event.score[event.pitchingTeam];
      const battingScore = event.score[event.battingTeam];
      return (
        <div className="flex flex-col items-start">
          <hr className="w-full h-1 border-none bg-gray-500" />
          <div className="flex flex-col items-start gap-1">
            <div className="whitespace-nowrap">
              {capitalize(half)} of {nthToString(inning)},{' '}
              <TeamName id={event.pitchingTeam} /> is pitching to{' '}
              <TeamName id={event.battingTeam} />.
            </div>
            <div>
              The score is{' '}
              {pitchingScore > battingScore ? (
                <>
                  <TeamName id={event.pitchingTeam} /> {pitchingScore},{' '}
                  <TeamName id={event.battingTeam} /> {battingScore}
                </>
              ) : (
                <>
                  <TeamName id={event.battingTeam} /> {battingScore},{' '}
                  <TeamName id={event.pitchingTeam} /> {pitchingScore}
                </>
              )}
            </div>
          </div>
          <hr className="w-full h-1 border-none bg-gray-500" />
        </div>
      );

    case 'strike':
      return (
        <>
          <PlayerName id={event.pitcherId} /> throws a strike to{' '}
          <PlayerName id={event.batterId} /> ({event.balls}-{event.strikes}).
        </>
      );

    case 'ball':
      return (
        <>
          <PlayerName id={event.pitcherId} /> throws a ball to{' '}
          <PlayerName id={event.batterId} /> ({event.balls}-{event.strikes}).
        </>
      );

    case 'out':
      return (
        <>
          <PlayerName id={event.batterId} /> made contact but is out!{' '}
          <PlayerName id={event.pitcherId} /> gets the out.
        </>
      );

    case 'hit':
      return (
        <>
          <PlayerName id={event.batterId} /> gets a hit!
          <PlayerName id={event.pitcherId} /> gives up a hit.
        </>
      );

    case 'homeRun':
      return (
        <>
          <PlayerName id={event.batterId} /> hits a home run!{' '}
          <PlayerName id={event.pitcherId} /> gives up a home run.
        </>
      );

    case 'triple':
      return (
        <>
          <PlayerName id={event.batterId} /> hits a triple!{' '}
          <PlayerName id={event.pitcherId} /> gives up a triple.
        </>
      );

    case 'double':
      return (
        <>
          <PlayerName id={event.batterId} /> hits a double!{' '}
          <PlayerName id={event.pitcherId} /> gives up a double.
        </>
      );
    case 'walk':
      return (
        <>
          <PlayerName id={event.batterId} /> walks!{' '}
          <PlayerName id={event.pitcherId} /> gives up a walk.
        </>
      );
    case 'strikeout':
      return (
        <>
          <PlayerName id={event.batterId} /> strikes out!{' '}
          <PlayerName id={event.pitcherId} /> gets the strikeout.
        </>
      );
    case 'foul':
      return (
        <>
          <PlayerName id={event.batterId} /> fouls off the pitch from{' '}
          <PlayerName id={event.pitcherId} /> ({event.balls}-{event.strikes}).
        </>
      );
    default:
      return 'Unknown event type: ' + (event as any).kind;
  }
}

export function GameLog({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const gameResult = finalState.league.gameResults
    .flat()
    .find((g) => g.id === id);
  if (!gameResult) {
    return <div>Game not found</div>;
  }
  const log = gameResult.gameLog;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold mb-0">Game Log</h1>
      <div className="flex flex-col gap-">
        {log.map((entry, index) => (
          <div key={index} className="p-1">
            <GameLogEvent event={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}
