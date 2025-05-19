import { GameRandom } from '@long-game/game-definition';
import {
  GameResult,
  League,
  LeagueGame,
  LeagueRound,
  RoundResult,
} from './types';

export function simulateRound(
  random: GameRandom,
  league: League,
  round: LeagueRound,
): RoundResult {
  const results: RoundResult = [];
  for (const game of round) {
    const result = simulateGame(random, league, game);
    results.push(result);
  }
  return results;
}

function simulateGame(
  random: GameRandom,
  league: League,
  game: LeagueGame,
): GameResult {
  // TODO: Implement a more sophisticated simulation
  let homeScore = random.int(0, 10);
  const awayScore = random.int(0, 10);
  // Simulate home field advantage
  if (homeScore === awayScore) {
    homeScore += 1;
  }
  const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const loser = homeScore > awayScore ? game.awayTeamId : game.homeTeamId;
  const score = {
    [game.homeTeamId]: homeScore,
    [game.awayTeamId]: awayScore,
  };
  return {
    winner,
    loser,
    score,
  };
}
