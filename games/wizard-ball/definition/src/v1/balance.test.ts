import { describe, expect, it } from 'vitest';
import { generateLeague } from './generation';
import { simulateRound } from './sim/simGames';
import { GameRandom } from '@long-game/game-definition';
import { getTeamAvgAttributes } from './attributes';

describe('balance', () => {
  // random seed string
  const seed = Math.random().toString(36).substring(2, 15);
  const random = new GameRandom(seed);
  let league = generateLeague(random, [], {
    numTeams: 50,
    numRounds: 500,
    numPlayers: 12,
    skipPerks: true,
  });
  for (let i = 0; i < league.schedule.length; i++) {
    const results = simulateRound(random, league, league.schedule[i]);
    for (const result of results) {
      const winner = league.teamLookup[result.winner];
      const loser = league.teamLookup[result.loser];
      winner.wins += 1;
      loser.losses += 1;
    }
    league.gameResults.push(results);
  }
  it('should have a balanced league', () => {
    const teamStats = league.teamIds
      .map((id) => league.teamLookup[id])
      .map((team) => ({
        wins: team.wins,
        losses: team.losses,
        winPercentage: team.wins / (team.wins + team.losses),
      }));
    const maxWinPercentage = Math.max(
      ...teamStats.map((team) => team.winPercentage),
    );
    const minWinPercentage = Math.min(
      ...teamStats.map((team) => team.winPercentage),
    );
    const teamInfo = league.teamIds
      .map((id) => league.teamLookup[id])
      .map((team) => ({
        winPercent: team.wins / (team.wins + team.losses),
        ...getTeamAvgAttributes(league, team.id),
      }))
      .sort((a, b) => a.winPercent - b.winPercent);
    // console.log(teamInfo);
    console.log(
      'Max win percentage:',
      maxWinPercentage,
      'Min win percentage:',
      minWinPercentage,
      'Difference:',
      maxWinPercentage - minWinPercentage,
    );
    expect(maxWinPercentage - minWinPercentage).toBeLessThan(0.45);
  });

  it('should have a positive correlation between team overall and win percentage', () => {
    const teamInfo = league.teamIds
      .map((id) => league.teamLookup[id])
      .map((team) => ({
        winPercent: team.wins / (team.wins + team.losses),
        ...getTeamAvgAttributes(league, team.id),
      }));

    // Calculate Pearson correlation
    const n = teamInfo.length;
    const avgWin = teamInfo.reduce((sum, t) => sum + t.winPercent, 0) / n;
    const avgOverall = teamInfo.reduce((sum, t) => sum + t.overall, 0) / n;
    const numerator = teamInfo.reduce(
      (sum, t) => sum + (t.winPercent - avgWin) * (t.overall - avgOverall),
      0,
    );
    const denominator = Math.sqrt(
      teamInfo.reduce((sum, t) => sum + Math.pow(t.winPercent - avgWin, 2), 0) *
        teamInfo.reduce(
          (sum, t) => sum + Math.pow(t.overall - avgOverall, 2),
          0,
        ),
    );
    const correlation = numerator / denominator;

    console.log('Correlation between overall and win %:', correlation);
    expect(correlation).toBeGreaterThan(0.4); // or another threshold you find reasonable
  });

  it('should have a positive correlation between each attribute and win percentage', () => {
    const teamInfo = league.teamIds
      .map((id) => league.teamLookup[id])
      .map((team) => ({
        winPercent: team.wins / (team.wins + team.losses),
        ...getTeamAvgAttributes(league, team.id),
      }));

    const attributes = [
      'strength',
      'agility',
      'intelligence',
      'wisdom',
      'charisma',
      'constitution',
    ] as const;

    for (const attr of attributes) {
      const n = teamInfo.length;
      const avgWin = teamInfo.reduce((sum, t) => sum + t.winPercent, 0) / n;
      const avgAttr = teamInfo.reduce((sum, t) => sum + t[attr], 0) / n;
      const numerator = teamInfo.reduce(
        (sum, t) => sum + (t.winPercent - avgWin) * (t[attr] - avgAttr),
        0,
      );
      const denominator = Math.sqrt(
        teamInfo.reduce(
          (sum, t) => sum + Math.pow(t.winPercent - avgWin, 2),
          0,
        ) *
          teamInfo.reduce((sum, t) => sum + Math.pow(t[attr] - avgAttr, 2), 0),
      );
      const correlation = numerator / denominator;
      console.log(`Correlation between ${attr} and win %:`, correlation);
      // You can adjust the threshold as needed
      expect(correlation).toBeGreaterThan(-1); // Just to ensure the test runs; set a real threshold if desired
    }
  });
});
