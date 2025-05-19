import { GameRandom } from '@long-game/game-definition';
import type {
  Base,
  GameResult,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
  PlayerId,
  PlayerStats,
  RoundResult,
} from './gameTypes';

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
  let gameState = initialGameState();
  gameState.battingTeam = game.awayTeamId;
  gameState.pitchingTeam = game.homeTeamId;
  for (const teamId of [game.homeTeamId, game.awayTeamId]) {
    gameState.teamData[teamId] = {
      score: 0,
      pitcher: league.teamLookup[teamId].playerIds[0],
      battingOrder: league.teamLookup[teamId].playerIds.slice(0, 9),
    };
    gameState.currentBatterIndex[teamId] = 0;
  }
  while (
    // Limit the game to 100 innings
    gameState.currentInning < 100 &&
    (gameState.currentInning < 18 ||
      gameState.teamData[game.homeTeamId].score ===
        gameState.teamData[game.awayTeamId].score)
  ) {
    gameState = simulateInning(random, gameState);
  }
  const homeScore = gameState.teamData[game.homeTeamId].score;
  const awayScore = gameState.teamData[game.awayTeamId].score;

  const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const loser = homeScore > awayScore ? game.awayTeamId : game.homeTeamId;
  const score = {
    [game.homeTeamId]: homeScore,
    [game.awayTeamId]: awayScore,
  };
  return {
    winner,
    id: game.id,
    playerStats: gameState.playerStats,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    teamData: gameState.teamData,
    loser,
    score,
  };
}

type PitchOutcome =
  | 'ball'
  | 'strike'
  | 'hit'
  | 'out'
  | 'double'
  | 'triple'
  | 'homeRun'
  | 'foul';

function randomTable<T>(
  random: GameRandom,
  table: Array<{ weight: number; value: T }>,
) {
  const totalWeight = table.reduce((sum, item) => sum + item.weight, 0);
  const randomValue = random.int(0, totalWeight - 1);
  let cumulativeWeight = 0;
  for (const item of table) {
    cumulativeWeight += item.weight;
    if (randomValue < cumulativeWeight) {
      return item.value;
    }
  }
  return table[table.length - 1].value; // Fallback
}

function initialGameState(): LeagueGameState {
  return {
    balls: 0,
    strikes: 0,
    outs: 0,
    bases: {
      1: null,
      2: null,
      3: null,
    },
    currentBatterIndex: {},
    currentInning: 1,
    battingTeam: '',
    pitchingTeam: '',
    teamData: {},
    playerStats: {},
  };
}

function updatePlayerStats(
  gameState: LeagueGameState,
  playerId: string,
  stats: Partial<PlayerStats>,
): LeagueGameState {
  if (!gameState.playerStats[playerId]) {
    gameState.playerStats[playerId] = {
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      runsBattedIn: 0,
      runs: 0,
      walks: 0,
      strikeouts: 0,
    };
  }
  const playerStats = gameState.playerStats[playerId];
  gameState.playerStats[playerId] = {
    ...playerStats,
    ...stats,
  };
  return gameState;
}

function addToPlayerStats(
  gameState: LeagueGameState,
  playerId: string,
  stats: Partial<PlayerStats>,
): LeagueGameState {
  if (!gameState.playerStats[playerId]) {
    gameState.playerStats[playerId] = {
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      runsBattedIn: 0,
      runs: 0,
      walks: 0,
      strikeouts: 0,
    };
  }
  const playerStats = gameState.playerStats[playerId];
  gameState.playerStats[playerId] = {
    ...playerStats,
    atBats: playerStats.atBats + (stats.atBats || 0),
    hits: playerStats.hits + (stats.hits || 0),
    doubles: playerStats.doubles + (stats.doubles || 0),
    triples: playerStats.triples + (stats.triples || 0),
    homeRuns: playerStats.homeRuns + (stats.homeRuns || 0),
    runsBattedIn: playerStats.runsBattedIn + (stats.runsBattedIn || 0),
    runs: playerStats.runs + (stats.runs || 0),
    walks: playerStats.walks + (stats.walks || 0),
    strikeouts: playerStats.strikeouts + (stats.strikeouts || 0),
  };
  return gameState;
}

function resetCount(gameState: LeagueGameState): LeagueGameState {
  gameState.balls = 0;
  gameState.strikes = 0;
  return gameState;
}

function resetBases(gameState: LeagueGameState): LeagueGameState {
  gameState.bases[1] = null;
  gameState.bases[2] = null;
  gameState.bases[3] = null;
  return gameState;
}

function advanceRunnerForced(
  gameState: LeagueGameState,
  base: Base,
  sourcePlayerId: PlayerId,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  for (let i = base; i < 4; i++) {
    const playerId = gameState.bases[i as Base];
    if (playerId === null) {
      // No one on this base, so we can stop
      break;
    } else if (i === 3) {
      // Run scores
      gameState = addToPlayerStats(gameState, playerId, { runs: 1 });
      gameState = addToPlayerStats(gameState, sourcePlayerId, {
        runsBattedIn: 1,
      });
      gameState.teamData[gameState.battingTeam].score += 1;
    } else {
      nextBases[(i + 1) as Base] = gameState.bases[i];
    }
  }
  return { ...gameState, bases: nextBases };
}

function incrementBatterIndex(
  gameState: LeagueGameState,
  teamId: string,
): LeagueGameState {
  gameState.currentBatterIndex[teamId] += 1;
  gameState.currentBatterIndex[teamId] %=
    gameState.teamData[teamId].battingOrder.length;
  return gameState;
}

function getCurrentBatter(gameState: LeagueGameState): string {
  return gameState.teamData[gameState.battingTeam].battingOrder[
    gameState.currentBatterIndex[gameState.battingTeam]
  ];
}

function applyWalk(gameState: LeagueGameState): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  gameState = advanceRunnerForced(gameState, 1, currentBatter);
  gameState.bases[1] = currentBatter;
  return gameState;
}

function applyHit(
  gameState: LeagueGameState,
  hitType: PitchOutcome,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  const currentBatter = getCurrentBatter(gameState);
  switch (hitType) {
    case 'hit':
      gameState = advanceRunnerForced(gameState, 1, currentBatter);
      gameState.bases[1] = currentBatter;
      break;
    case 'double':
      gameState = advanceRunnerForced(gameState, 1, currentBatter);
      gameState = advanceRunnerForced(gameState, 2, currentBatter);
      nextBases[2] = currentBatter;
      break;
    case 'triple':
      gameState = advanceRunnerForced(gameState, 1, currentBatter);
      gameState = advanceRunnerForced(gameState, 2, currentBatter);
      gameState = advanceRunnerForced(gameState, 3, currentBatter);
      nextBases[3] = currentBatter;
      break;
    case 'homeRun':
      gameState = advanceRunnerForced(gameState, 1, currentBatter);
      gameState = advanceRunnerForced(gameState, 2, currentBatter);
      gameState = advanceRunnerForced(gameState, 3, currentBatter);
      gameState.teamData[gameState.battingTeam].score += 1;
      break;
    default:
      break;
  }
  return gameState;
}

function simulatePitch(
  random: GameRandom,
  gameState: LeagueGameState,
): LeagueGameState {
  const batterId = getCurrentBatter(gameState);
  // Determine whether the pitch is a ball or strike
  const isStrike = random.float(0, 1) < 0.63;

  // Determine the outcome of the pitch
  let outcome: PitchOutcome;
  // If the pitch is a strike, check if the batter swung
  const swingChance = isStrike ? 0.68 : 0.3;
  const batterSwung = random.float(0, 1) < swingChance;
  if (!batterSwung) {
    outcome = isStrike ? 'strike' : 'ball';
  } else {
    const contactChance = isStrike ? 0.85 : 0.6;
    const contactMade = random.float(0, 1) < contactChance;
    if (contactMade) {
      outcome = isStrike
        ? randomTable(random, [
            { weight: 15, value: 'hit' },
            { weight: 5, value: 'double' },
            { weight: 1, value: 'triple' },
            { weight: 4, value: 'homeRun' },
            { weight: 15, value: 'foul' },
            { weight: 60, value: 'out' },
          ])
        : randomTable(random, [
            { weight: 8, value: 'hit' },
            { weight: 2, value: 'double' },
            { weight: 0.2, value: 'triple' },
            { weight: 1, value: 'homeRun' },
            { weight: 15, value: 'foul' },
            { weight: 74, value: 'out' },
          ]);
    } else {
      outcome = 'strike';
    }
  }

  // Update the game state based on the outcome
  switch (outcome) {
    case 'ball':
      // Increment ball count
      gameState.balls += 1;
      break;
    case 'strike':
      // Increment strike count
      gameState.strikes += 1;
      break;
    case 'foul':
      // Increment foul count
      if (gameState.strikes < 2) {
        gameState.strikes += 1;
      }
      break;
    case 'out':
      // Increment out count
      gameState.outs += 1;
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1 });
      gameState = incrementBatterIndex(gameState, gameState.battingTeam);
      gameState = resetCount(gameState);

      break;
    case 'hit':
    case 'double':
    case 'triple':
    case 'homeRun':
      // Apply hit to the game state
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1, hits: 1 });
      if (outcome === 'double') {
        gameState = addToPlayerStats(gameState, batterId, { doubles: 1 });
      } else if (outcome === 'triple') {
        gameState = addToPlayerStats(gameState, batterId, { triples: 1 });
      } else if (outcome === 'homeRun') {
        gameState = addToPlayerStats(gameState, batterId, {
          homeRuns: 1,
          runsBattedIn: 1,
          runs: 1,
        });
      }
      gameState = applyHit(gameState, outcome);
      break;
  }

  if (gameState.balls >= 4) {
    gameState = applyWalk(gameState);
    gameState = resetCount(gameState);
    gameState = addToPlayerStats(gameState, batterId, { atBats: 1, walks: 1 });
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
  }
  if (gameState.strikes >= 3) {
    // Strikeout
    gameState = addToPlayerStats(gameState, batterId, {
      atBats: 1,
      strikeouts: 1,
    });
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
    gameState = resetCount(gameState);
    gameState.outs += 1;
  }

  return gameState;
}

function simulateInning(
  random: GameRandom,
  gameState: LeagueGameState,
): LeagueGameState {
  while (gameState.outs < 3) {
    gameState = simulatePitch(random, gameState);
  }
  // Switch teams
  const temp = gameState.battingTeam;
  gameState.battingTeam = gameState.pitchingTeam;
  gameState.pitchingTeam = temp;
  gameState.outs = 0;
  gameState = resetCount(gameState);
  gameState = resetBases(gameState);
  gameState.currentInning += 1;
  return gameState;
}
