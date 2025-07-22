import { GameRandom } from '@long-game/game-definition';
import { ActualPitch } from '../data/pitchData.js';
import type { Base, League, LeagueGameState } from '../gameTypes.js';
import { scaleAttributePercent } from '../utils.js';
import {
  getActivePlayerPerks,
  getModifiedCompositeBattingRatings,
} from './ratings.js';
import { addToPlayerStats } from './stats.js';
import { updatePlayerHeat } from './streak.js';
import { checkTriggerEvent } from './trigger.js';
import { getCurrentPitcher } from './utils.js';

const STEAL_SECOND_ATTEMPT_CHANCE = 0.04;
const STEAL_THIRD_ATTEMPT_CHANCE = 0.01;
const STEAL_AGILITY_FACTOR = 20;
const STEAL_SECOND_SUCCESS_CHANCE = 0.8;
const STEAL_THIRD_SUCCESS_CHANCE = 0.7;
const STEAL_DEFENDER_FACTOR = 0.2;

/** Determine if any runners are going to steal, then attempt the steals */
export function determineSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
  pitchData: ActualPitch,
): LeagueGameState {
  const catcherId = league.teamLookup[gameState.pitchingTeam].positionChart.c;
  if (!catcherId) {
    throw new Error('No catcher found for steal attempt');
  }
  const catcherComposite = getModifiedCompositeBattingRatings(
    catcherId,
    league,
    gameState,
    getActivePlayerPerks(catcherId, league, gameState),
  );
  const playerOnFirst = gameState.bases[1];
  const playerOnSecond = gameState.bases[2];
  const playerOnThird = gameState.bases[3];
  if (playerOnFirst !== null && playerOnSecond === null) {
    const runnerComposite = getModifiedCompositeBattingRatings(
      playerOnFirst,
      league,
      gameState,
      getActivePlayerPerks(playerOnFirst, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing +
        (10 - catcherComposite.fielding) * STEAL_DEFENDER_FACTOR,
      STEAL_AGILITY_FACTOR,
    );
    const stealAttemptChance = STEAL_SECOND_ATTEMPT_CHANCE * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 1, league, pitchData);
    }
  }
  if (playerOnSecond !== null && playerOnThird === null) {
    const runnerComposite = getModifiedCompositeBattingRatings(
      playerOnSecond,
      league,
      gameState,
      getActivePlayerPerks(playerOnSecond, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing +
        (10 - catcherComposite.fielding) * STEAL_DEFENDER_FACTOR,
      STEAL_AGILITY_FACTOR,
    );
    const stealAttemptChance = STEAL_THIRD_ATTEMPT_CHANCE * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 2, league, pitchData);
    }
  }
  // TODO: Implement stealing home
  return gameState;
}

/** Applys results of a steal attempt (either successfully taking a base or getting thrown out) */
function attemptSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  fromBase: Base,
  league: League,
  pitchData: ActualPitch,
): LeagueGameState {
  const playerId = gameState.bases[fromBase];
  if (!playerId) {
    return gameState;
  }
  const catcherId = league.teamLookup[gameState.pitchingTeam].positionChart.c;
  if (!catcherId) {
    throw new Error('No catcher found for steal attempt');
  }
  const pitcherId = getCurrentPitcher(gameState);
  const defenderComposite = getModifiedCompositeBattingRatings(
    catcherId,
    league,
    gameState,
    getActivePlayerPerks(catcherId, league, gameState),
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    playerId,
    league,
    gameState,
    getActivePlayerPerks(playerId, league, gameState),
  );
  const agilityFactor = scaleAttributePercent(
    batterComposite.stealing +
      (10 - defenderComposite.fielding) * STEAL_DEFENDER_FACTOR,
    1 / 0.8,
  );
  const baseFactor =
    fromBase === 2 ? STEAL_SECOND_SUCCESS_CHANCE : STEAL_THIRD_SUCCESS_CHANCE;
  const stealSuccessChance = baseFactor * agilityFactor;
  const isSuccessful = random.float(0, 1) < stealSuccessChance;
  if (isSuccessful) {
    gameState.bases[fromBase] = null;
    if (fromBase === 3) {
      gameState.teamData[gameState.battingTeam].score += 1;
      gameState = addToPlayerStats(gameState, playerId, {
        runs: 1,
      });
      league = updatePlayerHeat('batting', playerId, league, 'run');
      league = updatePlayerHeat('pitching', pitcherId, league, 'run');
    } else {
      gameState.bases[(fromBase + 1) as Base] = playerId;
    }
    gameState = addToPlayerStats(gameState, playerId, {
      stolenBases: 1,
    });
    league = updatePlayerHeat('batting', playerId, league, 'steal');
    league = updatePlayerHeat('pitching', catcherId, league, 'steal');
    league = updatePlayerHeat('pitching', pitcherId, league, 'steal');
  } else {
    gameState = addToPlayerStats(gameState, playerId, {
      caughtStealing: 1,
    });
    league = updatePlayerHeat('batting', playerId, league, 'caughtStealing');
    league = updatePlayerHeat('pitching', catcherId, league, 'caughtStealing');
    league = updatePlayerHeat('pitching', pitcherId, league, 'caughtStealing');
    gameState.outs += 1;
    gameState = addToPlayerStats(gameState, getCurrentPitcher(gameState), {
      outsPitched: 1,
    });
  }

  gameState = checkTriggerEvent(
    {
      kind: 'steal',
      success: isSuccessful,
    },
    playerId,
    gameState,
    league,
    random,
    pitchData,
  );

  return gameState;
}
