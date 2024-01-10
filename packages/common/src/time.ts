export function convertTimezone(utcDate: string, timezone: string): Date {
  const date = new Date(utcDate);
  return new Date(
    date.toLocaleDateString('en-US', {
      timeZone: timezone,
    }),
  );
}

/**
 * Converts any time into a key which represents the day.
 * For grouping things by days.
 */
export function toDayKeyString(date: Date): string {
  return date.toISOString().split('T')[0];
}
