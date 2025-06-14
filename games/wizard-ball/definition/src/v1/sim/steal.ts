import { GameRandom } from '@long-game/game-definition';
import type { LeagueGameState, Base, League } from '../gameTypes';
import { scaleAttributePercent } from '../utils';
import {
  getModifiedCompositeBattingRatings,
  getActivePlayerPerks,
} from './ratings';
import { getCurrentPitcher } from './utils';
import { addToPlayerStats } from './stats';
import { updatePlayerHeat } from './streak';

function attemptSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  fromBase: Base,
  league: League,
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
    batterComposite.stealing + (10 - defenderComposite.fielding) / 5,
    1 / 0.8,
  );
  const baseFactor = fromBase === 2 ? 0.8 : 0.7;
  const stealSuccessChance = baseFactor * agilityFactor;
  if (random.float(0, 1) < stealSuccessChance) {
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
  return gameState;
}
export function determineSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
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
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 5,
      20,
    );
    const stealAttemptChance = 0.04 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 1, league);
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
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 5,
      20,
    );
    const stealAttemptChance = 0.01 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 2, league);
    }
  }
  // TODO: Implement stealing home
  return gameState;
}
