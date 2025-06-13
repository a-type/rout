import { describe, bench } from 'vitest';
import { generateLeague } from './generation';
import { GameRandom } from '@long-game/game-definition';
import {
  initialGameState,
  setupGame,
  simulateGame,
  simulatePitch,
  simulateRound,
} from './simGames';

describe('benchmark', () => {
  const random = new GameRandom('test');
  describe('generate league', () => {
    bench('generate league', () => {
      generateLeague(random, [], { numTeams: 8 });
    });
  });

  describe('sim round', () => {
    const league = generateLeague(random, [], { numTeams: 8, numRounds: 10 });
    bench('sim round', () => {
      simulateRound(random, league, league.schedule[league.currentWeek]);
    });
  });

  describe('sim game', () => {
    const league = generateLeague(random, [], { numTeams: 2, numRounds: 1 });
    bench('sim game', () => {
      simulateGame(random, league, league.schedule[league.currentWeek][0]);
    });
  });

  describe('sim pitch', () => {
    const league = generateLeague(random, [], { numTeams: 2, numRounds: 1 });
    let gameState = initialGameState(league.schedule[league.currentWeek][0]);
    gameState = setupGame(
      league,
      league.schedule[league.currentWeek][0],
      gameState,
    );
    bench('sim pitch', () => {
      simulatePitch(random, gameState, league);
    });
  });
});
