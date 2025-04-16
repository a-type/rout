import { describe, expect, it } from 'vitest';
import { getPeriodStart, roundFormat } from './rounds.js';

describe('game round helpers', () => {
  describe('get period start', () => {
    it('should round 1 day period to midnight in local timezone', () => {
      expect(
        getPeriodStart(
          new Date('2020-01-01T00:00:00Z'),
          'days',
          'America/Los_Angeles',
        ).toISOString(),
      ).toBe(new Date('2020-01-01T08:00:00Z').toISOString());
    });
    it('should round 1 hour period to nearest hour (timezone is not relevant, really)', () => {
      expect(
        getPeriodStart(
          new Date('2020-01-01T04:32:40Z'),
          'hours',
          'America/Los_Angeles',
        ).toISOString(),
      ).toBe(new Date('2020-01-01T04:00:00Z').toISOString());
    });
  });

  describe('periodic rounds', () => {
    it('returns round 0 when current time is within initial period', () => {
      expect(
        roundFormat.periodic(
          'days',
          1,
        )({
          currentTime: new Date('2024-01-13T21:00:00Z'),
          gameTimeZone: 'America/New_York',
          members: [],
          // games can start at anytime during the day...
          // the period should snap to the prior midnight in the game's timezone
          startedAt: new Date('2024-01-13T20:00:00Z'),
          turns: [],
        }),
      ).toEqual(0);
    });

    it('returns correct rounds for later periods', () => {
      expect(
        roundFormat.periodic(
          'days',
          1,
        )({
          currentTime: new Date('2024-01-14T21:00:00Z'),
          gameTimeZone: 'America/New_York',
          members: [],
          // games can start at anytime during the day...
          // the period should snap to the prior midnight in the game's timezone
          startedAt: new Date('2024-01-13T20:00:00Z'),
          turns: [],
        }),
      ).toEqual(1);

      expect(
        roundFormat.periodic(
          'days',
          1,
        )({
          currentTime: new Date('2024-01-15T22:00:00Z'),
          gameTimeZone: 'America/New_York',
          members: [],
          // try varying start time a bit
          startedAt: new Date('2024-01-13T16:00:00Z'),
          turns: [],
        }),
      ).toEqual(2);
    });
  });

  describe('synced rounds', () => {
    it('returns round 0 when no turns have been played', () => {
      expect(
        roundFormat.sync()({
          currentTime: new Date('2024-01-14T21:00:00Z'),
          gameTimeZone: 'America/New_York',
          members: [
            {
              id: 'u-1',
            },
            {
              id: 'u-2',
            },
          ],
          // games can start at anytime during the day...
          // the period should snap to the prior midnight in the game's timezone
          startedAt: new Date('2024-01-13T20:00:00Z'),
          turns: [],
        }),
      ).toEqual(0);
    });

    it('returns round 1 when all players made 1 turn, and some have 2', () => {
      expect(
        roundFormat.sync()({
          currentTime: new Date('2024-01-14T21:00:00Z'),
          gameTimeZone: 'America/New_York',
          members: [
            {
              id: 'u-1',
            },
            {
              id: 'u-2',
            },
          ],
          // games can start at anytime during the day...
          // the period should snap to the prior midnight in the game's timezone
          startedAt: new Date('2024-01-13T20:00:00Z'),
          turns: [
            {
              createdAt: '2024-01-13T20:00:00Z',
              data: {},
              roundIndex: 0,
              playerId: 'u-1',
            },
            {
              createdAt: '2024-01-13T20:00:00Z',
              data: {},
              roundIndex: 0,
              playerId: 'u-2',
            },
            {
              createdAt: '2024-01-13T20:00:00Z',
              data: {},
              roundIndex: 1,
              playerId: 'u-1',
            },
          ],
        }),
      ).toEqual(1);
    });
  });
});
