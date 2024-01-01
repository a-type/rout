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
