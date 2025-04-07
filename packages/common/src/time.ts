import { fromZonedTime } from 'date-fns-tz/fromZonedTime';

/**
 * Converts an abstract idea of "day, time" into
 * UTC from a given timezone.
 */
export function withTimezone(
  /**
   * Purposefully not using a Date here as it's
   * confusing and easy to mess up.
   */
  data: {
    year: number;
    month: number;
    date: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
  timezone: string,
): Date {
  return fromZonedTime(
    new Date(
      data.year,
      data.month,
      data.date,
      data.hour,
      data.minute,
      data.second,
    ),
    timezone,
  );
}

/**
 * Converts any time into a key which represents the day.
 * For grouping things by days.
 */
export function toDayKeyString(date: Date): string {
  return date.toISOString().split('T')[0];
}
