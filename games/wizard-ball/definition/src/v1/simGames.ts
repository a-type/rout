import { GameRandom } from '@long-game/game-definition';
import type {
  Base,
  GameResult,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
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
  };
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
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  for (let i = base; i < 4; i++) {
    if (gameState.bases[i as Base] === null) {
      // No one on this base, so we can stop
      break;
    } else if (i === 3) {
      // Run scores
      gameState.teamData[gameState.battingTeam].score += 1;
    } else {
      nextBases[(i + 1) as Base] = gameState.bases[i];
    }
  }
  return { ...gameState, bases: nextBases };
}

function applyWalk(gameState: LeagueGameState): LeagueGameState {
  const currentBatter =
    gameState.teamData[gameState.battingTeam].battingOrder[
      gameState.currentBatterIndex[gameState.battingTeam]
    ];
  gameState = advanceRunnerForced(gameState, 1);
  gameState.bases[1] = currentBatter;
  gameState = resetCount(gameState);
  return gameState;
}

function applyHit(
  gameState: LeagueGameState,
  hitType: PitchOutcome,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  const currentBatter =
    gameState.teamData[gameState.battingTeam].battingOrder[
      gameState.currentBatterIndex[gameState.battingTeam]
    ];
  switch (hitType) {
    case 'hit':
      gameState = advanceRunnerForced(gameState, 1);
      gameState.bases[1] = currentBatter;
      break;
    case 'double':
      gameState = advanceRunnerForced(gameState, 1);
      gameState = advanceRunnerForced(gameState, 2);
      nextBases[2] = currentBatter;
      break;
    case 'triple':
      gameState = advanceRunnerForced(gameState, 1);
      gameState = advanceRunnerForced(gameState, 2);
      gameState = advanceRunnerForced(gameState, 3);
      nextBases[3] = currentBatter;
      break;
    case 'homeRun':
      gameState = advanceRunnerForced(gameState, 1);
      gameState = advanceRunnerForced(gameState, 2);
      gameState = advanceRunnerForced(gameState, 3);
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
      break;
    case 'hit':
    case 'double':
    case 'triple':
    case 'homeRun':
      // Apply hit to the game state
      gameState = applyHit(gameState, outcome);
      break;
  }
  if (gameState.balls >= 4) {
    gameState = applyWalk(gameState);
  }
  if (gameState.strikes >= 3) {
    // Strikeout
    gameState.currentBatterIndex[gameState.battingTeam] += 1;
    gameState.currentBatterIndex[gameState.battingTeam] %=
      gameState.teamData[gameState.battingTeam].battingOrder.length;
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
