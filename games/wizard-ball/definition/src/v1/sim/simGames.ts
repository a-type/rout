import { GameRandom } from '@long-game/game-definition';
import type {
  GameResult,
  HitGameLogEvent,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
  PitchOutcome,
  PositionChartKey,
  RoundResult,
} from '../gameTypes';
import {
  getInningInfo,
  isPitcher,
  last,
  scaleAttributePercent,
} from '../utils';
import Logger from '../logger';
import { determinePitchType } from './pitchType';
import { type HitResult, determineHitResult } from './hitResult';
import {
  getModifiedCompositeBattingRatings,
  getModifiedCompositePitchingRatings,
  getActivePlayerPerks,
} from './ratings';
import { determineSteal } from './steal';
import { considerSwapPitcher, swapPitcher } from './swap';
import { updatePlayerHeat } from './streak';
import { addToPlayerStats, checkSaveWinLossEligility } from './stats';
import {
  endOfInning,
  getCurrentBatter,
  getCurrentPitcher,
  incrementBatterIndex,
  logsPitchData,
  resetCount,
} from './utils';
import { advanceRunnerForced, advanceAllRunners } from './runners';
import { determineSwing, determineContact } from './swing';
import { checkTriggerEvent } from './trigger';
import { determineClutchFactor } from './clutch';
import { updateStaminaAfterPitch } from './stamina';
import { updateInjuryAfterPitch } from './injury';

export const logger = new Logger('state');
// const logger = new Logger('console');

export function simulateRound(
  random: GameRandom,
  league: League,
  round: LeagueRound,
): RoundResult {
  const results: RoundResult = [];
  for (const game of round) {
    // Hack - ensure that only the most recent round gets the game logs
    league.gameResults = league.gameResults.map((r) =>
      r.map(({ gameLog, ...g }) => g),
    );
    const result = simulateGame(random, league, game);
    results.push(result);
  }
  return results;
}

function checkGameOver(
  gameState: LeagueGameState,
  leagueGame: LeagueGame,
): boolean {
  const homeScore = gameState.teamData[leagueGame.homeTeamId].score;
  const awayScore = gameState.teamData[leagueGame.awayTeamId].score;
  const battingScore =
    gameState.battingTeam === leagueGame.homeTeamId ? homeScore : awayScore;
  const pitchingScore =
    gameState.battingTeam === leagueGame.homeTeamId ? awayScore : homeScore;

  // force game to end in case of a bug
  if (gameState.currentInning > 50) {
    return true;
  }
  const { half, inning } = getInningInfo(gameState.currentInning);

  if (inning < 9) {
    return false;
  }

  if (half === 'bottom' && battingScore !== pitchingScore) {
    return true;
  }
  if (half === 'top' && pitchingScore > battingScore) {
    return true;
  }
  return false;
}

export function setupGame(
  league: League,
  game: LeagueGame,
  gameState: LeagueGameState = initialGameState(game),
) {
  gameState.weather = game.weather;
  gameState.ballpark = game.ballpark;
  gameState.battingTeam = game.awayTeamId;
  gameState.pitchingTeam = game.homeTeamId;
  for (const teamId of [game.homeTeamId, game.awayTeamId]) {
    const team = league.teamLookup[teamId];
    const pitcher =
      team.pitchingOrder[team.nextPitcherIndex % team.pitchingOrder.length];
    team.nextPitcherIndex =
      (team.nextPitcherIndex + 1) % team.pitchingOrder.length;
    gameState.teamData[teamId] = {
      score: 0,
      pitchers: [pitcher],
      battingOrder: team.battingOrder.map((pos) => {
        if (isPitcher(pos)) {
          return pitcher;
        }
        if (!team.positionChart[pos as PositionChartKey]) {
          throw new Error(
            `No player for position ${pos} ${JSON.stringify(
              team.positionChart,
            )}`,
          );
        }
        return team.positionChart[pos as PositionChartKey]!;
      }),
    };
    gameState.currentBatterIndex[teamId] = 0;
  }
  return gameState;
}

export function simulateGame(
  random: GameRandom,
  league: League,
  game: LeagueGame,
): GameResult {
  let gameState = initialGameState(game);
  gameState = setupGame(league, game, gameState);
  while (true) {
    gameState = simulateInning(random, gameState, league);
    if (checkGameOver(gameState, game)) {
      break;
    }
    gameState = endOfInning(gameState);
  }
  const homeScore = gameState.teamData[game.homeTeamId].score;
  const awayScore = gameState.teamData[game.awayTeamId].score;

  const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const loser = homeScore > awayScore ? game.awayTeamId : game.homeTeamId;
  // Update W/L for pitchers
  if (gameState.winningPitcherId) {
    gameState = addToPlayerStats(gameState, gameState.winningPitcherId, {
      wins: 1,
    });
    league = updatePlayerHeat(
      'pitching',
      gameState.winningPitcherId!,
      league,
      'win',
    );
  }
  if (gameState.losingPitcherId) {
    gameState = addToPlayerStats(gameState, gameState.losingPitcherId, {
      losses: 1,
    });
    league = updatePlayerHeat(
      'pitching',
      gameState.losingPitcherId!,
      league,
      'loss',
    );
  }
  const lastPitcherForWinner = last(gameState.teamData[winner].pitchers);
  if (
    lastPitcherForWinner &&
    (gameState.playerStats[lastPitcherForWinner]?.outsPitched ?? 0) >= 9
  ) {
    gameState.saveElligiblePitcherId = lastPitcherForWinner;
  }
  if (
    gameState.saveElligiblePitcherId &&
    gameState.saveElligiblePitcherId !== gameState.winningPitcherId
  ) {
    gameState = addToPlayerStats(gameState, gameState.saveElligiblePitcherId, {
      saves: 1,
    });
    league = updatePlayerHeat(
      'pitching',
      gameState.saveElligiblePitcherId!,
      league,
      'save',
    );
  }

  const score = {
    [game.homeTeamId]: homeScore,
    [game.awayTeamId]: awayScore,
  };
  return {
    winner,
    id: game.id,
    inningData: gameState.inningData,
    playerStats: gameState.playerStats,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    teamData: gameState.teamData,
    loser,
    score,
    gameLog: gameState.gameLog,
    weather: gameState.weather,
    ballpark: gameState.ballpark,
  };
}

export function initialGameState(game: LeagueGame): LeagueGameState {
  return {
    balls: 0,
    strikes: 0,
    outs: 0,
    bases: {
      1: null,
      2: null,
      3: null,
    },
    inningData: [],
    currentBatterIndex: {},
    currentInning: 1,
    battingTeam: '',
    pitchingTeam: '',
    teamData: {},
    playerStats: {},
    gameLog: [],
    weather: 'clear',
    ballpark: 'bigField',
    leagueGame: game,
    winningPitcherId: null,
    losingPitcherId: null,
    saveElligiblePitcherId: null,
  };
}

function applyWalk(
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  gameState = advanceRunnerForced(
    gameState,
    league,
    1,
    currentBatter,
    currentPitcher,
  );
  gameState.bases[1] = currentBatter;
  return gameState;
}

function applyHit(
  gameState: LeagueGameState,
  league: League,
  hitType: PitchOutcome,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  switch (hitType) {
    case 'hit':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        1,
      );
      gameState.bases[1] = currentBatter;
      break;
    case 'double':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        2,
      );
      nextBases[2] = currentBatter;
      break;
    case 'triple':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        3,
      );
      nextBases[3] = currentBatter;
      break;
    case 'homeRun':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        3,
      );
      gameState.teamData[gameState.battingTeam].score += 1;
      break;
    default:
      break;
  }
  return gameState;
}

export function simulatePitch(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const batterId = getCurrentBatter(gameState);
  const batter = league.playerLookup[batterId];
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  let nextBatter = false;
  const initialRuns = gameState.teamData[gameState.battingTeam].score;
  const initialClutchFactor = determineClutchFactor(gameState);

  const pitchData = determinePitchType(
    random,
    batter,
    pitcher,
    gameState,
    league,
  );

  // Determine the outcome of the pitch
  let outcome: PitchOutcome;
  let hitResult: HitResult | null = null;
  const batterSwung = determineSwing(
    random,
    pitchData.isStrike,
    batter,
    league,
    gameState,
    pitchData,
  );
  if (!batterSwung) {
    outcome = pitchData.isStrike ? 'strike' : 'ball';
  } else {
    const contactMade = determineContact(
      random,
      pitchData.isStrike,
      batter,
      league,
      gameState,
      pitchData,
    );
    if (contactMade) {
      hitResult = determineHitResult(
        random,
        pitchData,
        pitchData.isStrike,
        gameState,
        league,
      );
      outcome = hitResult.outcome;
    } else {
      outcome = 'strike';
    }
  }

  // Update the game state based on the outcome
  switch (outcome) {
    case 'ball': {
      // Increment ball count
      gameState.balls += 1;
      if (gameState.balls >= 4) {
        gameState = applyWalk(gameState, league);
        gameState = addToPlayerStats(gameState, batterId, {
          walks: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          pWalks: 1,
        });
        const runsScored =
          gameState.teamData[gameState.battingTeam].score - initialRuns;
        gameState = logger.addToGameLog(
          {
            kind: 'walk',
            batterId,
            pitcherId,
            pitchData: logsPitchData(pitchData),
            runsScored,
            important: runsScored > 0,
          },
          gameState,
        );
        league = updatePlayerHeat('batting', batterId, league, 'walk');
        league = updatePlayerHeat('pitching', pitcherId, league, 'walk');
        nextBatter = true;
      } else {
        gameState = logger.addToGameLog(
          {
            kind: 'ball',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
            pitchData: logsPitchData(pitchData),
          },
          gameState,
        );
        gameState = determineSteal(random, gameState, league, pitchData);
      }
      break;
    }
    case 'strike':
      // Increment strike count
      gameState.strikes += 1;
      if (gameState.strikes >= 3) {
        // Strikeout
        gameState = addToPlayerStats(gameState, batterId, {
          atBats: 1,
          strikeouts: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          ks: 1,
          outsPitched: 1,
        });
        gameState = logger.addToGameLog(
          {
            kind: 'strikeout',
            batterId,
            pitcherId,
            swung: batterSwung,
            pitchData: logsPitchData(pitchData),
            // TODO: Revisit later
            important: false, //true,
          },
          gameState,
        );

        gameState = checkTriggerEvent(
          {
            kind: 'strikeout',
            isPitcher: false,
          },
          batterId,
          gameState,
          league,
          random,
          pitchData,
        );
        gameState = checkTriggerEvent(
          {
            kind: 'strikeout',
            isPitcher: true,
          },
          pitcherId,
          gameState,
          league,
          random,
          pitchData,
        );

        league = updatePlayerHeat('batting', batterId, league, 'strikeout');
        league = updatePlayerHeat('pitching', pitcherId, league, 'strikeout');
        nextBatter = true;
        gameState.outs += 1;
      } else {
        gameState = logger.addToGameLog(
          {
            kind: 'strike',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
            swung: batterSwung,
            pitchData: logsPitchData(pitchData),
          },
          gameState,
        );
        gameState = determineSteal(random, gameState, league, pitchData);
      }
      break;
    case 'foul':
      // Increment foul count
      if (gameState.strikes < 2) {
        gameState.strikes += 1;
      }
      gameState = logger.addToGameLog(
        {
          kind: 'foul',
          batterId,
          pitcherId,
          strikes: gameState.strikes,
          balls: gameState.balls,
          pitchData: logsPitchData(pitchData),
        },
        gameState,
      );
      break;
    case 'out': {
      // TODO: Handle sacrifice hits
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }

      let outCount = 1;
      let result: HitGameLogEvent['kind'] = 'out';
      gameState = checkTriggerEvent(
        {
          kind: 'defenderOut',
        },
        hitResult.defenderId!,
        gameState,
        league,
        random,
        pitchData,
      );

      if (gameState.outs < 3) {
        // Check for sacrifice fly
        if (hitResult.hitType === 'fly' && hitResult.hitPower !== 'weak') {
          gameState = advanceRunnerForced(
            gameState,
            league,
            3,
            batterId,
            pitcherId,
          );
          if (hitResult.hitPower === 'strong') {
            gameState = advanceRunnerForced(
              gameState,
              league,
              2,
              batterId,
              pitcherId,
            );
          }
        } else if (hitResult.hitType === 'grounder') {
          // Check for double play
          // TODO: Handle this in a more sophisticated way
          if (
            gameState.bases[1] &&
            hitResult.defender &&
            hitResult.defenderId
          ) {
            const defenderRating = hitResult.defenderRating;
            const baseChance =
              hitResult.defender === 'ss' || hitResult.defender === '2b'
                ? 0.25
                : 0.12;
            const difficultyModifer = hitResult.hitPower !== 'normal' ? -5 : 0;
            const modifiedChance =
              baseChance *
              scaleAttributePercent(defenderRating + difficultyModifer, 2);
            if (random.float(0, 1) < modifiedChance) {
              // const otherDefender = hitResult.defender === 'ss' ? '2b' : 'ss';
              // const team = league.teamLookup[gameState.pitchingTeam];
              // const otherDefenderId = team.positionChart[otherDefender];
              // if (!otherDefenderId) {
              //   throw new Error(
              //     `No player found for defender position: ${otherDefender}`,
              //   );
              // }
              gameState.bases[1] = null; // Force out at first base
              outCount = 2; // Double play
              gameState = addToPlayerStats(gameState, hitResult.defenderId, {
                doublePlays: 1,
              });
              // gameState = addToPlayerStats(gameState, otherDefenderId, {
              //   doublePlays: 1,
              // });
              league = updatePlayerHeat(
                'pitching',
                hitResult.defenderId,
                league,
                'doublePlay',
              );
              // league = updatePlayerHeat(
              //   'pitching',
              //   otherDefenderId,
              //   league,
              //   'doublePlay',
              // );
              league = updatePlayerHeat(
                'pitching',
                pitcherId,
                league,
                'doublePlay',
              );
              league = updatePlayerHeat(
                'batting',
                batterId,
                league,
                'doublePlay',
              );
              result = 'doublePlay';
            }
          }
        }
      }
      gameState.outs += outCount;
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        outsPitched: outCount,
      });

      const runsScored =
        gameState.teamData[gameState.battingTeam].score - initialRuns;

      gameState = logger.addToGameLog(
        {
          kind: result,
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
          hitTable: hitResult.hitTable,
          defenderRating: hitResult.defenderRating,
          pitchData: logsPitchData(pitchData),
          runsScored,
          important: runsScored > 0,
        },
        gameState,
      );
      nextBatter = true;
      break;
    }
    case 'hit':
    case 'double':
    case 'triple':
    case 'homeRun':
      // Apply hit to the game state
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1, hits: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        hitsAllowed: 1,
      });
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }
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
        gameState = addToPlayerStats(gameState, pitcherId, {
          homeRunsAllowed: 1,
          earnedRuns: 1,
        });
      }
      gameState = applyHit(gameState, league, outcome);
      const runsScored =
        gameState.teamData[gameState.battingTeam].score - initialRuns;
      gameState = logger.addToGameLog(
        {
          kind: outcome,
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
          hitTable: hitResult.hitTable,
          defenderRating: hitResult.defenderRating,
          pitchData: logsPitchData(pitchData),
          runsScored,

          important: runsScored > 0,
        },
        gameState,
      );
      gameState = checkTriggerEvent(
        {
          kind: 'hit',
          outcome,
          isPitcher: false,
        },
        batterId,
        gameState,
        league,
        random,
        pitchData,
      );
      gameState = checkTriggerEvent(
        {
          kind: 'hit',
          outcome,
          isPitcher: true,
        },
        pitcherId,
        gameState,
        league,
        random,
        pitchData,
      );
      league = updatePlayerHeat('batting', batterId, league, outcome);
      league = updatePlayerHeat('pitching', pitcherId, league, outcome);
      nextBatter = true;
      break;
  }

  // Adjust pitching stamina
  gameState = updateStaminaAfterPitch(gameState, league, pitchData, outcome);
  gameState = updateInjuryAfterPitch(random, gameState, league, pitchData);

  if (nextBatter) {
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
    gameState = resetCount(gameState);
  }

  // Manage save eligibility
  gameState = checkSaveWinLossEligility(gameState, league);

  return gameState;
}

function simulateInning(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const initialScore = gameState.teamData[gameState.battingTeam].score;
  gameState = logger.addToGameLog(
    {
      kind: 'inningStart',
      battingTeam: gameState.battingTeam,
      pitchingTeam: gameState.pitchingTeam,
      inning: gameState.currentInning,
      score: {
        [gameState.battingTeam]:
          gameState.teamData[gameState.battingTeam].score,
        [gameState.pitchingTeam]:
          gameState.teamData[gameState.pitchingTeam].score,
      },
    },
    gameState,
  );
  while (gameState.outs < 3) {
    const nextPitcher = considerSwapPitcher(gameState, league);
    if (nextPitcher) {
      gameState = swapPitcher(gameState, nextPitcher);
    }
    gameState = simulatePitch(random, gameState, league);
  }
  const nextScore = gameState.teamData[gameState.battingTeam].score;
  gameState.inningData.push({
    runs: nextScore - initialScore,
    battingTeam: gameState.battingTeam,
    pitchingTeam: gameState.pitchingTeam,
  });

  return gameState;
}
