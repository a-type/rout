/**
 * Helpers for common round formats
 */

import { withTimezone } from '@long-game/common';
import add from 'date-fns/add';
import { RoundIndexDecider } from './gameDefinition.js';

export type PeriodType = 'days' | 'hours' | 'minutes';

export function getPeriodStart(
  sourceTime: Date,
  periodType: PeriodType,
  timezone: string,
): Date {
  if (periodType === 'hours') {
    // timezone not relevant here, just round down to the hour
    const time = new Date(sourceTime);
    time.setMinutes(0, 0, 0);
    return time;
  }
  if (periodType === 'days') {
    // round source time (UTC) to midnight local time
    return withTimezone(
      {
        year: sourceTime.getUTCFullYear(),
        month: sourceTime.getUTCMonth(),
        date: sourceTime.getUTCDate(),
        hour: 0,
        minute: 0,
        second: 0,
      },
      timezone,
    );
  }
  if (periodType === 'minutes') {
    // round to the nearest minute
    const time = new Date(sourceTime);
    time.setSeconds(0, 0);
    return time;
  }
  throw new Error(`Unknown period type ${periodType}`);
}

function periodicRounds(
  periodType: PeriodType,
  periodValue: number = 1,
): RoundIndexDecider<any, any> {
  return ({ startedAt, currentTime, gameTimeZone }) => {
    // round down start time according to period and timezone's 00:00 time.
    // for example, if the period is 1 day and the timezone is PST, then
    // the start time will be rounded down to the nearest midnight PST.
    const globalStart = getPeriodStart(startedAt, periodType, gameTimeZone);
    const currentStart = getPeriodStart(currentTime, periodType, gameTimeZone);
    let roundStart = globalStart;
    let roundIndex = 0;

    // increment by period until the round start is the same as
    // the current time's round start. this is how many rounds
    // have passed until now.

    // why not just do some math? because daylight savings time
    // and other things affect how long some periods actually are,
    // like days. we rely instead on the logic inside `add` to evaluate
    // those differences for us.
    while (roundStart < currentStart) {
      roundStart = add(roundStart, {
        [periodType]: periodValue,
      });
      roundIndex++;
    }

    return roundIndex;
  };
}

function syncRounds(): RoundIndexDecider<any, any> {
  return ({ turns, members }) => {
    // rounds advance when all members have played a turn
    const maxRoundIndex = turns.reduce((max, turn) => {
      return Math.max(max, turn.roundIndex);
    }, 0);

    // are the number of turns in the last round equal to the number of members?
    const lastRoundTurns = turns.filter(
      (turn) => turn.roundIndex === maxRoundIndex,
    );
    if (lastRoundTurns.length === members.length) {
      return maxRoundIndex + 1;
    }
    return maxRoundIndex;
  };
}

export const roundFormat = {
  periodic: periodicRounds,
  sync: syncRounds,
};
