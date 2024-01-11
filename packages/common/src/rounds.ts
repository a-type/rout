import { convertTimezone, toDayKeyString } from './time.js';

/**
 * Gets the start and end of the round for a given day.
 * Start is inclusive, end is exclusive.
 */
export function getRoundTimerange(day: Date, timezone: string) {
  const today = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const tomorrow = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + 1,
  );

  const roundStart = new Date(
    today.toLocaleDateString('en-US', {
      timeZone: timezone,
    }),
  );
  const roundEnd = new Date(
    tomorrow.toLocaleDateString('en-US', {
      timeZone: timezone,
    }),
  );

  return {
    roundStart,
    roundEnd,
  };
}

export type GameRound<Move> = {
  moves: Move[];
  roundNumber: number;
  roundStart: Date;
  roundEnd: Date;
};

export function movesToRounds<Move extends { createdAt: string }>(
  moves: Move[],
  timezone: string,
): GameRound<Move>[] {
  // split moves by day, according to timezone
  const movesByDay = moves.reduce((acc, move) => {
    const day = toDayKeyString(convertTimezone(move.createdAt, timezone));
    acc[day] = acc[day] || [];
    acc[day].push(move);
    return acc;
  }, {} as Record<string, Move[]>);

  const days = Object.keys(movesByDay).sort();
  const rounds = days.map((day, roundNumber) => {
    const moves = movesByDay[day];
    // ok this is a little convoluted. converting the date key (which
    // is just a date, like 2024-01-10, no TZ) back to UTC (because it's implied
    // to be in game session timezone) then back to the game session timezone
    // within getRoundTimerange
    // TODO: simplify this?
    const { roundStart, roundEnd } = getRoundTimerange(
      convertTimezone(day, 'UTC'),
      timezone,
    );
    return {
      moves,
      roundNumber,
      roundStart,
      roundEnd,
    };
  });

  return rounds;
}
