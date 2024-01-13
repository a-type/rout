/**
 * Gets the start and end of the round for a given day.
 * Start is inclusive, end is exclusive.
 */
export function getRoundTimerange(day: Date, timezone: string) {
  const today = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    day.getHours(),
    day.getMinutes(),
  );
  const tomorrow = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    day.getHours(),
    day.getMinutes() + 1,
  );

  const roundStart = new Date(
    today.toLocaleString('en-US', {
      timeZone: timezone,
    }),
  );
  const roundEnd = new Date(
    tomorrow.toLocaleString('en-US', {
      timeZone: timezone,
    }),
  );

  return {
    roundStart,
    roundEnd,
  };
}

export type GameRound<Turn> = {
  turns: Turn[];
  roundIndex: number;
};
