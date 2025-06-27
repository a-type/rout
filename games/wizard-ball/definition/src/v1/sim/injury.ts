import { GameRandom } from '@long-game/game-definition';
import { League, LeagueGameState } from '../gameTypes';
import { logger } from '../logger';
import { scaleAttributePercent } from '../utils';
import { considerSwapPitcher, swapPitcher } from './swap';
import { getCurrentBatter, getCurrentPitcher } from './utils';
import {
  getModifiedCompositePitchingRatings,
  getActivePlayerPerks,
  getModifiedCompositeBattingRatings,
} from './ratings';
import { ActualPitch } from '../data/pitchData';

const BASE_RELIEVER_INJURY_CHANCE = 0.0005;
const BASE_STARTER_INJURY_CHANCE = 0.00025;
const BASE_BATTER_INJURY_CHANCE = 0.001;
const DURABILTY_FACTOR = 4;

export function updateInjuryAfterPitch(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
  pitchData: ActualPitch,
): LeagueGameState {
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  const batterId = getCurrentBatter(gameState);
  const batter = league.playerLookup[batterId];
  const isReliever = pitcher.positions.some((pos) => pos === 'rp');
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
  if (
    random.float(0, 1) <
    (isReliever ? BASE_RELIEVER_INJURY_CHANCE : BASE_STARTER_INJURY_CHANCE) /
      scaleAttributePercent(pitcherComposite.durability, DURABILTY_FACTOR)
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
    BASE_BATTER_INJURY_CHANCE /
      scaleAttributePercent(batterComposite.durability, DURABILTY_FACTOR)
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
  return gameState;
}
