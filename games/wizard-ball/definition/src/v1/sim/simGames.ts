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
import { addToPlayerStats } from './stats';
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
    case 'ball':
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
        gameState = logger.addToGameLog(
          {
            kind: 'walk',
            batterId,
            pitcherId,
            pitchData: logsPitchData(pitchData),
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
        gameState = determineSteal(random, gameState, league);
      }
      break;
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
          },
          gameState,
        );

        getActivePlayerPerks(
          batterId,
          league,
          gameState,
          pitchData.kind,
        ).forEach((perk) => {
          if ('trigger' in perk.effect && perk.effect.trigger) {
            gameState = perk.effect.trigger({
              event: { kind: 'strikeout', isPitcher: false },
              random,
              gameState,
              league,
              player: batter,
            });
          }
        });

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
        gameState = determineSteal(random, gameState, league);
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
    case 'out':
      // TODO: Handle sacrifice hits
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }

      let outCount = 1;
      let result: HitGameLogEvent['kind'] = 'out';
      getActivePlayerPerks(
        hitResult.defenderId!,
        league,
        gameState,
        pitchData.kind,
      ).forEach((perk) => {
        if ('trigger' in perk.effect && perk.effect.trigger) {
          gameState = perk.effect.trigger({
            event: { kind: 'defenderOut' },
            random,
            gameState,
            league,
            player: league.playerLookup[hitResult.defenderId!],
          });
        }
      });

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
        },
        gameState,
      );
      nextBatter = true;
      break;
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
        },
        gameState,
      );
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
      league = updatePlayerHeat('batting', batterId, league, outcome);
      league = updatePlayerHeat('pitching', pitcherId, league, outcome);
      nextBatter = true;
      break;
  }

  // Adjust pitching stamina
  const pitcherComposite = getModifiedCompositePitchingRatings(
    pitcherId,
    league,
    gameState,
    getActivePlayerPerks(pitcherId, league, gameState, pitchData.kind),
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    gameState,
    getActivePlayerPerks(batter.id, league, gameState, pitchData.kind),
  );
  const isReliever = pitcher.positions.some((pos) => pos === 'rp');
  let pitcherStaminaChange =
    scaleAttributePercent(
      pitcherComposite.durability,
      isReliever ? 1.004 : 1.0015,
    ) - (isReliever ? 1.016 : 1.006);
  pitcherStaminaChange *=
    {
      strike: 1,
      ball: 1,
      foul: 1,
      out: 1,
      hit: 1.5,
      double: 2,
      triple: 3,
      homeRun: 5,
    }[outcome] ?? 1;
  pitcher.stamina = Math.max(-0.25, pitcher.stamina + pitcherStaminaChange);
  batter.stamina = Math.max(
    -0.25,
    batter.stamina +
      scaleAttributePercent(batterComposite.durability, 1.005) -
      1.02,
  );
  if (
    random.float(0, 1) <
    (isReliever ? 0.0005 : 0.00025) /
      scaleAttributePercent(pitcherComposite.durability, 4)
  ) {
    league.playerLookup[pitcherId].statusIds.injured =
      (league.playerLookup[pitcherId].statusIds.injured ?? 0) +
      Math.floor(random.float(2, 10));
    gameState = logger.addToGameLog(
      {
        kind: 'injury',
        playerId: pitcherId,
      },
      gameState,
    );
    const pid = considerSwapPitcher(gameState, league);
    if (pid) {
      gameState = swapPitcher(gameState, pid);
    }
  }
  if (
    random.float(0, 1) <
    0.001 / scaleAttributePercent(batterComposite.durability, 4)
  ) {
    league.playerLookup[batterId].statusIds.injured =
      (league.playerLookup[batterId].statusIds.injured ?? 0) +
      Math.floor(random.float(2, 10));
    gameState = logger.addToGameLog(
      {
        kind: 'injury',
        playerId: batterId,
      },
      gameState,
    );
    // TODO: Swap batter if injured
  }

  if (nextBatter) {
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
    gameState = resetCount(gameState);
  }

  const battingTeamScore = gameState.teamData[gameState.battingTeam].score;
  const pitchingTeamScore = gameState.teamData[gameState.pitchingTeam].score;
  if (battingTeamScore >= pitchingTeamScore) {
    gameState.saveElligiblePitcherId = null;
    if (
      !gameState.winningPitcherId ||
      league.teamLookup[gameState.pitchingTeam].playerIds.includes(
        gameState.winningPitcherId,
      )
    ) {
      const tied = battingTeamScore === pitchingTeamScore;
      gameState.winningPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.battingTeam].pitchers)!;
      gameState.losingPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.pitchingTeam].pitchers)!;
    }
  }

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
