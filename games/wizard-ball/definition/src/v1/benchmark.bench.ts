import { describe, bench } from 'vitest';
import { generateLeague } from './generation';
import { GameRandom } from '@long-game/game-definition';
import { simulateRound } from './simGames';

describe('benchmark', () => {
  describe('generate league', () => {
    const random = new GameRandom('test');
    bench('generate league', () => {
      generateLeague(random, [], { numTeams: 20 });
    });
  });

  describe('sim game', () => {
    const random = new GameRandom('test');
    const league = generateLeague(random, [], { numTeams: 2, numRounds: 1 });
    bench('sim game', () => {
      simulateRound(random, league, league.schedule[league.currentWeek]);
    });
  });
});
