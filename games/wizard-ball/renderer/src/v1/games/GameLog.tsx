import type {
  ActualPitch,
  GameLogEvent,
  HitGameLogEvent,
  LogsPitchData,
  TriggerSource,
} from '@long-game/game-wizard-ball-definition';
import { getInningInfo } from '@long-game/game-wizard-ball-definition';
import { BallparkChip } from '../BallparkChip.js';
import { ItemDefChip } from '../items/ItemChip.js';
import { PerkChip } from '../perks/PerkChip.js';
import { PlayerChip } from '../players/PlayerChip.js';
import { TeamName } from '../teams/TeamName.js';
import { TooltipPlus } from '../TooltipPlus.js';
import { useGameResults } from '../useGameResults.js';
import {
  capitalize,
  hitDirectionToString,
  hitTypeToString,
  nthToString,
  numberToWord,
  pitchQualityToString,
  roundFloat,
  toPercentage,
} from '../utils.js';
import { WeatherChip } from '../WeatherChip.js';

export function ContactInfoTooltip({
  contactChance,
}: {
  contactChance?: ActualPitch['contactChance'];
}) {
  if (!contactChance) {
    return null;
  }
  return (
    <TooltipPlus
      className="bg-gray-wash color-gray-ink max-w-[400px]"
      content={
        <div className="flex flex-col gap-1">
          <span>Raw={toPercentage(contactChance.raw)}</span>
          <span>
            Pitcher=
            {roundFloat(contactChance.pitcherFactor, 2)}
          </span>
          <span>
            Batter=
            {roundFloat(contactChance.batterFactor, 2)} (
            {roundFloat(contactChance.batterRating, 1)} CON)
          </span>
          <span>
            Final=
            {toPercentage(contactChance.adjusted)}
          </span>
          <br />
          {contactChance.activePerks.join(', ')}
        </div>
      }
    >
      <span className="bg-gray-wash color-gray-ink p-1 rounded cursor-pointer hover:bg-darken-1 hover:color-gray ml-1 text-xs font-mono">
        INFO
      </span>
    </TooltipPlus>
  );
}

export function runsScoredToString(runs: number) {
  return runs > 0
    ? `${capitalize(numberToWord(runs))} run${runs > 1 ? 's' : ''} scored!`
    : null;
}

export function HitTableInfo({ event }: { event: HitGameLogEvent }) {
  return (
    <TooltipPlus
      className="bg-gray-wash color-gray-ink max-w-[400px]"
      content={
        <div className="flex flex-col gap-1">
          <span>Defender rating={roundFloat(event.defenderRating)}</span>
          {Object.entries(event.hitTable).map(([key, value]) => {
            return (
              <span key={key}>
                {key}: {roundFloat(value)}
              </span>
            );
          })}
        </div>
      }
    >
      <span className="bg-gray-wash color-gray-ink p-1 rounded cursor-pointer hover:bg-darken-1 hover:color-gray ml-1 text-xs font-mono">
        HIT INFO
      </span>
    </TooltipPlus>
  );
}

export function PitchChip({ pitchData }: { pitchData: LogsPitchData }) {
  return (
    <TooltipPlus
      className="bg-gray-wash color-gray-ink max-w-[400px]"
      content={
        <div className="flex flex-col gap-1">
          <span>{capitalize(pitchData.kind)}</span>
          <span>Quality: {roundFloat(pitchData.quality)}</span>
          <span>Contact chance: {roundFloat(pitchData.contactFactor)}</span>
          <span>Accuracy bonus: {pitchData.accuracyBonus}</span>
          <span>Swing chance: {roundFloat(pitchData.swingFactor)}</span>
          <span>Velocity: {roundFloat(pitchData.velocity)}</span>
          <span>Movement: {roundFloat(pitchData.movement)}</span>
        </div>
      }
    >
      <span className="bg-white color-gray-ink p-1 rounded cursor-pointer hover:bg-gray-wash hover:color-gray">
        {pitchQualityToString(pitchData.quality)}{' '}
        {pitchData.isStrike ? 'strike' : 'ball'}
      </span>
    </TooltipPlus>
  );
}

export function SourceChip({ source }: { source: TriggerSource }) {
  if (source.kind === 'weather') {
    // @ts-expect-error
    return <WeatherChip id={source.id} />;
  }
  if (source.kind === 'ballpark') {
    // @ts-expect-error
    return <BallparkChip id={source.id} />;
  }
  if (source.kind === 'perk') {
    return <PerkChip id={source.id} />;
  }
  if (source.kind === 'item') {
    return <ItemDefChip id={source.id} />;
  }
  return <span className="color-gray-dark">{source.id}</span>;
}

export function GameLogEvent({ event }: { event: GameLogEvent }) {
  switch (event.kind) {
    case 'inningStart':
      const { inning, half } = getInningInfo(event.inning);
      const pitchingScore = event.score[event.pitchingTeam];
      const battingScore = event.score[event.battingTeam];
      return (
        <div className="flex flex-col items-start">
          <hr className="w-full h-1 border-none bg-gray" />
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
          <hr className="w-full h-1 border-none bg-gray" />
        </div>
      );

    case 'pitcherChange':
      return (
        <div className="flex flex-col items-start">
          <hr className="w-full h-1 border-none bg-gray" />
          <div className="flex flex-col items-start gap-1">
            <div>
              <PlayerChip noPositions id={event.newPitcherId} /> is now pitching
              for <TeamName bold id={event.teamId} />, replacing{' '}
              <PlayerChip noPositions id={event.oldPitcherId} />.
            </div>
          </div>
          <hr className="w-full h-1 border-none bg-gray" />
        </div>
      );

    case 'injury':
      return (
        <div className="flex flex-col items-start">
          <hr className="w-full h-1 border-none bg-gray" />
          <div className="flex flex-col items-start gap-1">
            <div>
              <PlayerChip noPositions id={event.playerId} /> has been injured!
            </div>
          </div>
          <hr className="w-full h-1 border-none bg-gray" />
        </div>
      );

    case 'trigger':
      return (
        <div className="flex flex-col items-start">
          <div className="flex flex-col items-start gap-1">
            <div>
              <PlayerChip noPositions id={event.playerId} /> triggered an effect
              from
              <div className="inline-flex mx-1">
                <SourceChip source={event.source} />
              </div>
              : {event.description}
            </div>
          </div>
        </div>
      );

    case 'strike':
      return (
        <>
          <PlayerChip noPositions id={event.pitcherId} /> throws a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          <PlayerChip noPositions id={event.batterId} />{' '}
          {event.swung ? '(swung)' : ''} ({event.balls}-{event.strikes}
          ).
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
        </>
      );

    case 'ball':
      return (
        <>
          <PlayerChip noPositions id={event.pitcherId} /> throws a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          <PlayerChip noPositions id={event.batterId} /> ({event.balls}-
          {event.strikes}
          ).
        </>
      );

    case 'out':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> made contact on a{' '}
          <PitchChip pitchData={event.pitchData} /> but is gotten out
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
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );

    case 'doublePlay':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> hit a{' '}
          <PitchChip pitchData={event.pitchData} /> into a double play! Defended
          by
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
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );

    case 'hit':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} hit on a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()})!{' '}
          {runsScoredToString(event.runsScored)}
          <PlayerChip noPositions id={event.pitcherId} /> gives up the hit.
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );

    case 'homeRun':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> hits a{' '}
          {hitTypeToString(event.type)} home run on a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          {hitDirectionToString(event.direction)} !{' '}
          {runsScoredToString(event.runsScored)}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a home run.
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );

    case 'triple':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} triple on a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()})!{' '}
          {runsScoredToString(event.runsScored)}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a triple.
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );

    case 'double':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> gets a{' '}
          {event.power === 'normal' ? '' : event.power}{' '}
          {hitTypeToString(event.type)} double on a{' '}
          <PitchChip pitchData={event.pitchData} /> to{' '}
          {hitDirectionToString(event.direction)} (
          {event.defender?.toUpperCase()})!{' '}
          {runsScoredToString(event.runsScored)}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a double.
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
          <HitTableInfo event={event} />
        </>
      );
    case 'walk':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> walks on a{' '}
          <PitchChip pitchData={event.pitchData} />!{' '}
          {runsScoredToString(event.runsScored)}
          <PlayerChip noPositions id={event.pitcherId} /> gives up a walk.
        </>
      );
    case 'strikeout':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> strikes out{' '}
          {event.swung
            ? event.pitchData.isStrike
              ? 'swinging'
              : 'chasing'
            : 'looking'}
          ! <PlayerChip noPositions id={event.pitcherId} /> gets the strikeout
          on a <PitchChip pitchData={event.pitchData} />.
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
        </>
      );
    case 'foul':
      return (
        <>
          <PlayerChip noPositions id={event.batterId} /> fouls off the{' '}
          <PitchChip pitchData={event.pitchData} /> from{' '}
          <PlayerChip noPositions id={event.pitcherId} /> ({event.balls}-
          {event.strikes}).
          <ContactInfoTooltip contactChance={event.pitchData.contactChance} />
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
      <div className="flex flex-col">
        {log.map((entry, index) => (
          <div key={index} className="p-1">
            <GameLogEvent event={entry} />
          </div>
        ))}
        {/* TODO: Add final score */}
      </div>
    </div>
  );
}
