import { LeagueGameState, League, PitchOutcome } from '../gameTypes';
import { ActualPitch } from '../data/pitchData';
import { scaleAttributePercent } from '../utils';
import {
  getModifiedCompositePitchingRatings,
  getActivePlayerPerks,
  getModifiedCompositeBattingRatings,
} from './ratings';
import { getCurrentBatter, getCurrentPitcher } from './utils';

const MIN_STAMINA = -0.25; // Minimum stamina value for players

const BASE_RELIEVER_STAMINA_CHANGE = 1.016;
const RELIEVER_DURABILITY_FACTOR = 1.004;
const BASE_STARTER_STAMINA_CHANGE = 1.006;
const STARTER_DURABILITY_FACTOR = 1.0015;
const BASE_BATTER_STAMINA_CHANGE = 1.02;
const BATTER_DURABILITY_FACTOR = 1.005;

const STARTER_RECOVERY_PER_GAME = 0.25;
const RELIEVER_RECOVERY_PER_GAME = 0.4;
const BATTER_RECOVERY_PER_GAME = 0.25;

export function updateStaminaAfterPitch(
  gameState: LeagueGameState,
  league: League,
  pitchData: ActualPitch,
  outcome: PitchOutcome,
): LeagueGameState {
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  const batterId = getCurrentBatter(gameState);
  const batter = league.playerLookup[batterId];
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
      isReliever ? RELIEVER_DURABILITY_FACTOR : STARTER_DURABILITY_FACTOR,
    ) -
    (isReliever ? BASE_RELIEVER_STAMINA_CHANGE : BASE_STARTER_STAMINA_CHANGE);
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
  pitcher.stamina = Math.max(
    MIN_STAMINA,
    pitcher.stamina + pitcherStaminaChange,
  );
  batter.stamina = Math.max(
    MIN_STAMINA,
    batter.stamina +
      scaleAttributePercent(
        batterComposite.durability,
        BATTER_DURABILITY_FACTOR,
      ) -
      BASE_BATTER_STAMINA_CHANGE,
  );

  return gameState;
}

export function recoverStaminaBetweenGames(league: League): League {
  Object.values(league.playerLookup).forEach((player) => {
    const recovery = player.positions.some((p) => p === 'sp')
      ? STARTER_RECOVERY_PER_GAME
      : player.positions.some((p) => p === 'rp')
        ? RELIEVER_RECOVERY_PER_GAME
        : BATTER_RECOVERY_PER_GAME;
    player.stamina = Math.min(1, player.stamina + recovery);
  });

  return league;
}
