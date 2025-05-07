import { describe, expect, it } from 'vitest';
import { RoundIndexDecider } from './gameDefinition.js';
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
    describe('without requiring all players to play', () => {
      it('returns round 0 when current time is within initial period', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: false })({
            globalState: {},
            currentTime: new Date('2024-01-13T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: [],
          checkAgainAt: new Date('2024-01-14T05:00:00.000Z'),
        });
      });

      it('returns correct rounds for later periods', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: false })({
            globalState: {},
            currentTime: new Date('2024-01-14T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 1,
          pendingTurns: [],
          checkAgainAt: new Date('2024-01-15T05:00:00.000Z'),
        });

        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: false })({
            globalState: {},
            currentTime: new Date('2024-01-15T22:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [],
            // try varying start time a bit
            startedAt: new Date('2024-01-13T16:00:00Z'),
            turns: [],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 2,
          pendingTurns: [],
          checkAgainAt: new Date('2024-01-16T05:00:00.000Z'),
        });
      });
    });
    describe('requiring all players to play', () => {
      it('returns round 0 when current time is within initial period and not everyone has played', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: true })({
            globalState: {},
            currentTime: new Date('2024-01-13T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [{ id: 'u-1' }, { id: 'u-2' }],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: ['u-1', 'u-2'],
          // no checkAgainAt -- waiting on players
        });
      });
      it('returns round 0 when the current time is within the initial period and all players have played', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: true })({
            globalState: {},
            currentTime: new Date('2024-01-13T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [{ id: 'u-1' }, { id: 'u-2' }],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [
              {
                playerId: 'u-1',
                createdAt: '2024-01-13T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
              {
                playerId: 'u-2',
                createdAt: '2024-01-13T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
            ],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: [],
          checkAgainAt: new Date('2024-01-14T05:00:00.000Z'),
        });
      });

      it('does not advance the round if not all players have played', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: true })({
            globalState: {},
            currentTime: new Date('2024-01-14T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [{ id: 'u-1' }, { id: 'u-2' }],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [
              {
                playerId: 'u-1',
                createdAt: '2024-01-13T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
            ],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: ['u-2'],
        });
      });

      it('does not advance the round if not all players have played even after several elapsed periods', () => {
        expect(
          roundFormat.periodic('days', 1, { requireAllPlayersToPlay: true })({
            globalState: {},
            currentTime: new Date('2024-01-16T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [{ id: 'u-1' }, { id: 'u-2' }],
            // games can start at anytime during the day...
            // the period should snap to the prior midnight in the game's timezone
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [
              {
                playerId: 'u-1',
                createdAt: '2024-01-13T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
            ],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: ['u-2'],
        });
      });

      it('utilizes advancement delay a la periodic style when "unblocking" after elapsed periods', () => {
        const rounds = roundFormat.periodic('days', 1, {
          requireAllPlayersToPlay: true,
          advancementDelayMs: 10000,
        });
        const scenario = {
          globalState: {},
          // within advancement delay period according to u-2's last turn time
          currentTime: new Date('2024-01-16T20:00:05Z'),
          gameTimeZone: 'America/New_York',
          members: [{ id: 'u-1' }, { id: 'u-2' }],
          startedAt: new Date('2024-01-13T20:00:00Z'),
          turns: [
            {
              playerId: 'u-1',
              createdAt: '2024-01-13T20:00:00Z',
              data: {},
              roundIndex: 0,
            },
            {
              playerId: 'u-2',
              createdAt: '2024-01-16T20:00:00Z',
              data: {},
              roundIndex: 0,
            },
          ],
          environment: 'production',
        } satisfies Parameters<RoundIndexDecider<any, any>>[0];
        expect(rounds(scenario)).toEqual({
          roundIndex: 0,
          pendingTurns: [],
          checkAgainAt: new Date('2024-01-16T20:00:10Z'),
        });
        expect(
          rounds({
            ...scenario,
            currentTime: new Date('2024-01-16T20:00:15Z'),
          }),
        ).toEqual({
          roundIndex: 1,
          pendingTurns: ['u-1', 'u-2'],
        });
      });

      it('unblocks across multiple missed rounds', () => {
        expect(
          roundFormat.periodic('days', 1, {
            requireAllPlayersToPlay: true,
            advancementDelayMs: 10000,
          })({
            globalState: {},
            // within advancement delay period according to u-2's last turn time
            currentTime: new Date('2024-01-16T21:00:00Z'),
            gameTimeZone: 'America/New_York',
            members: [{ id: 'u-1' }, { id: 'u-2' }],
            startedAt: new Date('2024-01-13T20:00:00Z'),
            turns: [
              {
                playerId: 'u-1',
                createdAt: '2024-01-13T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
              {
                playerId: 'u-2',
                createdAt: '2024-01-16T20:00:00Z',
                data: {},
                roundIndex: 0,
              },
              {
                playerId: 'u-1',
                createdAt: '2024-01-16T20:00:15Z',
                data: {},
                roundIndex: 1,
              },
              {
                playerId: 'u-2',
                createdAt: '2024-01-16T20:00:15Z',
                data: {},
                roundIndex: 1,
              },
            ],
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 2,
          pendingTurns: ['u-1', 'u-2'],
        });
      });
    });
  });

  describe('synced rounds', () => {
    describe('with instant transition', () => {
      it('returns round 0 when no turns have been played', () => {
        expect(
          roundFormat.sync({ advancementDelayMs: 0 })({
            globalState: {},
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
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 0,
          pendingTurns: ['u-1', 'u-2'],
        });
      });

      it('returns round 1 when all players made 1 turn, and some have 2', () => {
        expect(
          roundFormat.sync({ advancementDelayMs: 0 })({
            globalState: {},
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
            environment: 'production',
          }),
        ).toEqual({
          roundIndex: 1,
          pendingTurns: ['u-2'],
        });
      });
    });
  });
  describe('with delayed transition', () => {
    it('returns round 0 when no turns have been played', () => {
      expect(
        roundFormat.sync({ advancementDelayMs: 10000 })({
          globalState: {},
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
          environment: 'production',
        }),
      ).toEqual({
        roundIndex: 0,
        pendingTurns: ['u-1', 'u-2'],
      });
    });

    it('returns round 1 when all players made 1 turn, and some have 2, and time is beyond advancement delay', () => {
      expect(
        roundFormat.sync({ advancementDelayMs: 10000 })({
          globalState: {},
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
          environment: 'production',
        }),
      ).toEqual({
        roundIndex: 1,
        pendingTurns: ['u-2'],
      });
    });

    it('returns round 0 with a check again when all players have made 1 turn but time has not advanced past delay', () => {
      expect(
        roundFormat.sync({ advancementDelayMs: 10000 })({
          globalState: {},
          currentTime: new Date('2024-01-13T20:00:01Z'),
          gameTimeZone: 'America/New_York',
          members: [
            {
              id: 'u-1',
            },
            {
              id: 'u-2',
            },
          ],
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
          ],
          environment: 'production',
        }),
      ).toEqual({
        roundIndex: 0,
        pendingTurns: [],
        checkAgainAt: new Date('2024-01-13T20:00:10Z'),
      });
    });
  });
});
