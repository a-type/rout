/**
 * Helpers for common round formats
 */

import { PrefixedId, withTimezone } from '@long-game/common';
import add from 'date-fns/esm/add';
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

export function checkAgainAtPeriodEnd({
  periodType,
  periodValue,
  currentTime,
  gameTimeZone,
}: {
  periodType: PeriodType;
  periodValue: number;
  currentTime: Date;
  gameTimeZone: string;
}) {
  return add(getPeriodStart(currentTime, periodType, gameTimeZone), {
    [periodType]: periodValue,
  });
}

export function notPlayedThisRound({
  turns,
  roundIndex,
  members,
}: {
  turns: any[];
  roundIndex: number;
  members: { id: PrefixedId<'u'> }[];
}) {
  // find the turns from the last round
  const thisRoundTurns = turns.filter((turn) => turn.roundIndex === roundIndex);
  // find the ids of the players who played in the last round
  const playersWhoPlayed = thisRoundTurns.map((turn) => turn.playerId);
  // filter out the players who have played
  return members
    .filter((member) => !playersWhoPlayed.includes(member.id))
    .map((m) => m.id);
}

function periodicRounds(
  periodType: PeriodType,
  periodValue: number = 1,
  {
    requireAllPlayersToPlay,
    advancementDelayMs = 10_000,
  }: {
    requireAllPlayersToPlay: boolean;
    advancementDelayMs?: number;
  } = { requireAllPlayersToPlay: true },
): RoundIndexDecider<any, any> {
  return (data) => {
    const { startedAt, currentTime, gameTimeZone, members, turns } = data;
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

    if (requireAllPlayersToPlay && roundIndex > 0) {
      // if all players are required to play, we must check that this condition is met for
      // the round before advancing. once a round is 'tardy,' we block advancement until all turns
      // are in, but then unblock and allow free advancement to 'catch up' to the current round period.
      // What this means in practice is that if the round is incomplete, we switch to sync mode.

      const lastRoundTurnsCount = turns.filter(
        (turn) => turn.roundIndex === roundIndex - 1,
      ).length;
      if (lastRoundTurnsCount < members.length) {
        return syncRounds({
          advancementDelayMs,
        })(data);
      }
    }

    const thisRoundTurnsCount = turns.filter(
      (turn) => turn.roundIndex === roundIndex,
    ).length;
    // do not schedule another check unless we could actually advance (all players played)
    const checkAgainAt =
      requireAllPlayersToPlay && thisRoundTurnsCount < members.length
        ? undefined
        : checkAgainAtPeriodEnd({
            periodType,
            periodValue,
            currentTime,
            gameTimeZone,
          });

    return {
      roundIndex,
      pendingTurns: notPlayedThisRound({ turns, roundIndex, members }),
      checkAgainAt,
    };
  };
}

function syncRounds(
  { advancementDelayMs }: { advancementDelayMs?: number } = {
    advancementDelayMs: 10_000,
  },
): RoundIndexDecider<any, any> {
  return ({ turns, members, currentTime }) => {
    // rounds advance when all members have played a turn
    const maxRoundIndex = turns.reduce((max, turn) => {
      return Math.max(max, turn.roundIndex);
    }, 0);

    // are the number of turns in the last round equal to the number of members?
    const lastRoundTurns = turns.filter(
      (turn) => turn.roundIndex === maxRoundIndex,
    );
    if (lastRoundTurns.length === members.length) {
      if (advancementDelayMs) {
        // if the last round is full, we need to wait for the advancement delay
        // before we can advance to the next round
        const lastTurn = lastRoundTurns[lastRoundTurns.length - 1];
        const lastTurnTime = new Date(lastTurn.createdAt);
        // need to wait to advance to the next round
        if (
          currentTime.getTime() - lastTurnTime.getTime() <
          advancementDelayMs
        ) {
          return {
            roundIndex: maxRoundIndex,
            pendingTurns: [],
            checkAgainAt: add(lastTurnTime, {
              seconds: advancementDelayMs / 1000,
            }),
          };
        }
      }

      return {
        roundIndex: maxRoundIndex + 1,
        pendingTurns: notPlayedThisRound({
          turns,
          roundIndex: maxRoundIndex + 1,
          members,
        }),
      };
    }
    return {
      roundIndex: maxRoundIndex,
      pendingTurns: notPlayedThisRound({
        turns,
        roundIndex: maxRoundIndex,
        members,
      }),
    };
  };
}

function perEnvironment({
  production,
  development,
}: {
  production: RoundIndexDecider<any, any>;
  development: RoundIndexDecider<any, any>;
}): RoundIndexDecider<any, any> {
  return (input) => {
    if (input.environment === 'production') {
      return production(input);
    }
    return development(input);
  };
}

export const roundFormat = {
  periodic: periodicRounds,
  sync: syncRounds,
  perEnvironment,
};
