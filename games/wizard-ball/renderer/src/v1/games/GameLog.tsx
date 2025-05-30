import type { GameLogEvent } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { TeamName } from '../teams/TeamName';
import { PlayerName } from '../players/PlayerName';
import { getInningInfo } from '@long-game/game-wizard-ball-definition';
import {
  capitalize,
  hitDirectionToString,
  hitTypeToString,
  nthToString,
} from '../utils';
import { useGameResults } from '../useGameResults';
import { PlayerChip } from '../players/PlayerChip';

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
              {capitalize(half)} of the {nthToString(inning)}, the{' '}
              <TeamName bold id={event.pitchingTeam} /> are pitching to the{' '}
              <TeamName bold id={event.battingTeam} />.
            </div>
            <div>
              The score is{' '}
              {pitchingScore > battingScore ? (
                <>
                  <TeamName bold id={event.pitchingTeam} /> {pitchingScore},{' '}
                  <TeamName bold id={event.battingTeam} /> {battingScore}
                </>
              ) : (
                <>
                  <TeamName bold id={event.battingTeam} /> {battingScore},{' '}
                  <TeamName bold id={event.pitchingTeam} /> {pitchingScore}
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
          <PlayerChip noPositions id={event.pitcherId} /> throws a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} to{' '}
          <PlayerChip noPositions id={event.batterId} />{' '}
          {event.swung ? '(swung)' : ''} ({event.balls}-{event.strikes}
          ).
        </>
      );

    case 'ball':
      return (
        <>
          <PlayerChip noPositions id={event.pitcherId} /> throws a ball to{' '}
          <PlayerChip noPositions id={event.batterId} /> ({event.balls}-
          {event.strikes}
          ).
        </>
      );

    case 'out':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> made contact on a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} but is gotten out
          {event.defenderId ? (
            <>
              {' '}
              by <PlayerChip noPositions id={event.defenderId} /> (
              {event.defender?.toUpperCase()}) on a{' '}
              {event.power === 'normal' ? '' : event.power}{' '}
              {hitTypeToString(event.type)} to{' '}
              {hitDirectionToString(event.direction)}
            </>
          ) : null}
          !
        </>
      );

    case 'hit':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} hit on a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()})!{' '}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a hit.
        </>
      );

    case 'homeRun':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> hits a{' '}
          {hitTypeToString(event.type)} home run on a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} to{' '}
          {hitDirectionToString(event.direction)} !{' '}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a home run.
        </>
      );

    case 'triple':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} triple on a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()}) !{' '}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a triple.
        </>
      );

    case 'double':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} double on a{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()}) !{' '}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a double.
        </>
      );
    case 'walk':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> walks!{' '}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a walk.
        </>
      );
    case 'strikeout':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> strikes out{' '}
          {event.swung
            ? event.inStrikeZone
              ? 'swinging'
              : 'chasing'
            : 'looking'}
          ! <PlayerChip noPositions id={event.pitcherId} /> gets the strikeout.
        </>
      );
    case 'foul':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> fouls off the{' '}
          {event.inStrikeZone ? 'strike' : 'ball'} from{' '}
          <PlayerChip noPositions id={event.pitcherId} /> ({event.balls}-
          {event.strikes}).
        </>
      );
    default:
      return 'Unknown event type: ' + (event as any).kind;
  }
}

export function GameLog({ id }: { id: string }) {
  const game = useGameResults({ id });
  if (!game) {
    return <div>Game not found</div>;
  }
  const log = game.gameLog;
  if (!log || log.length === 0) {
    return <div>No game log available</div>;
  }
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
