/**
 * Helpers for common round formats
 */

import { PrefixedId, withTimezone } from '@long-game/common';
import add from 'date-fns/esm/add/index.js';
import { BaseTurnData, Turn } from './gameDefinition.js';

export interface RoundIndexContext<
  GlobalState = unknown,
  TurnData extends BaseTurnData = BaseTurnData,
> {
  turns: Turn<TurnData>[];
  /**
   * Membership information is limited to things that might be
   * useful for determining round index. Try to keep this light.
   */
  members: { id: PrefixedId<'u'> }[];
  startedAt: Date;
  currentTime: Date;
  gameTimeZone: string;
  globalState: GlobalState;
  environment: 'production' | 'development';
}

export type RoundIndexDecider<GlobalState, TurnData extends BaseTurnData> = (
  data: RoundIndexContext<GlobalState, TurnData>,
) => RoundIndexResult;
export interface RoundIndexResult {
  roundIndex: number;
  /**
   * Which players can and should submit a turn.
   * Note that for non-concurrent turn-based games,
   * this should be the 'hotseat' player only. For
   * concurrent turn-based games, this should
   * be all players who have not yet submitted a turn,
   * but not include players who have already submitted
   * a turn. For free-play games, this should either
   * be like concurrent, or just all players (doesn't matter
   * much).
   */
  pendingTurns: PrefixedId<'u'>[];
  /**
   * When the system should check the round again,
   * regardless of change to game state. Use for
   * scheduled round advancement which does not depend
   * on played turns.
   */
  checkAgainAt?: Date | null;
}

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

export function latestTurnInRound({
  turns,
  roundIndex,
}: {
  turns: any[];
  roundIndex: number;
}): Date | undefined {
  const thisRoundTurns = turns.filter((turn) => turn.roundIndex === roundIndex);
  if (thisRoundTurns.length === 0) {
    return undefined;
  }
  // find the latest turn in the last round
  const latestTurn = thisRoundTurns.reduce<Date>((latest, turn) => {
    return new Date(turn.createdAt) > latest
      ? new Date(turn.createdAt)
      : latest;
  }, new Date(0));
  return latestTurn;
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
        return delayedRounds(advancementDelayMs)(syncRounds())(data);
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

export function maxRoundFromTurns(turns: Turn<any>[]) {
  return turns.reduce((max, turn) => {
    return Math.max(max, turn.roundIndex);
  }, 0);
}

function syncRounds(): RoundIndexDecider<any, any> {
  return ({ turns, members }) => {
    // rounds advance when all members have played a turn
    const maxRoundIndex = maxRoundFromTurns(turns);

    // are the number of turns in the last round equal to the number of members?
    const lastRoundTurns = turns.filter(
      (turn) => turn.roundIndex === maxRoundIndex,
    );
    if (lastRoundTurns.length === members.length) {
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

// Utilities

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

function delayedRounds(advancementDelayMs: number = 10_000) {
  return (roundDecider: RoundIndexDecider<any, any>) => {
    if (advancementDelayMs <= 0) return roundDecider;
    return (ctx: RoundIndexContext<any, any>) => {
      // compute the naive round index. if the prior played round is within the
      // delay envelope, return a check-again instead.
      const maxRound = maxRoundFromTurns(ctx.turns);
      const lastTurnTime = latestTurnInRound({
        turns: ctx.turns,
        roundIndex: maxRound,
      });
      const isLastTurnTimeWithinDelay =
        lastTurnTime &&
        lastTurnTime.getTime() + advancementDelayMs > ctx.currentTime.getTime();
      const newState = roundDecider(ctx);

      // round has advanced according to the underlying logic, but delay is not yet over
      if (newState.roundIndex > maxRound && isLastTurnTimeWithinDelay) {
        return {
          roundIndex: maxRound,
          pendingTurns: [],
          checkAgainAt: add(lastTurnTime, {
            seconds: advancementDelayMs / 1000,
          }),
        };
      }

      // not within delay - return the underlying answer
      return newState;
    };
  };
}

export const roundFormat = {
  periodic: periodicRounds,
  sync: syncRounds,
  perEnvironment,
  delayedAdvance: delayedRounds,
};
