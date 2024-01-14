import { describe, it, expect } from 'vitest';
import { withTimezone } from './time.js';

describe('time helpers', () => {
  describe('time zone converter', () => {
    it('converts a UTC date to a timezone', () => {
      expect(
        withTimezone(
          {
            year: 2020,
            month: 0,
            date: 1,
            hour: 0,
            minute: 0,
            second: 0,
          },
          'America/Los_Angeles',
        ).toISOString(),
      ).toBe(new Date('2020-01-01T08:00:00Z').toISOString());
    });
  });
});
