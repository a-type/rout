import { GameRandom } from '@long-game/game-definition';
import { ActualPitch } from '../data/pitchData.js';
import type { League, LeagueGameState, Player } from '../gameTypes.js';
import { scaleAttributePercent } from '../utils.js';
import {
  getActivePlayerPerks,
  getModifiedCompositeBattingRatings,
} from './ratings.js';
import { randomByWeight } from './utils.js';

const BASE_STRIKE_SWING_CHANCE = 0.68;
const BASE_BALL_SWING_CHANCE = 0.25;
const BASE_STRIKE_CONTACT_CHANCE = 0.8;
const BASE_BALL_CONTACT_CHANCE = 0.6;

export function determineSwing(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  game: LeagueGameState,
  pitchData: ActualPitch,
): boolean {
  const baseSwingChance = isStrike
    ? BASE_STRIKE_SWING_CHANCE
    : BASE_BALL_SWING_CHANCE;
  const activePerks = getActivePlayerPerks(
    batter.id,
    league,
    game,
    pitchData.kind,
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    game,
    activePerks,
  );
  const pitchSwingFactor = pitchData.swingFactor;
  const plateDisciplineFactor =
    scaleAttributePercent(batterComposite.plateDiscipline, 3) **
    (isStrike ? 1 : -1);
  const swing = randomByWeight<boolean>(random, [
    {
      value: true,
      weight: baseSwingChance * pitchSwingFactor * plateDisciplineFactor,
    },
    { value: false, weight: 1 - baseSwingChance },
  ]);
  return swing;
}
export function determineContact(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  gameState: LeagueGameState,
  pitchData: ActualPitch,
): boolean {
  const activePerks = getActivePlayerPerks(
    batter.id,
    league,
    gameState,
    pitchData.kind,
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    gameState,
    activePerks,
  );
  let baseContactChance = isStrike
    ? BASE_STRIKE_CONTACT_CHANCE
    : BASE_BALL_CONTACT_CHANCE;

  const batterContactFactor = scaleAttributePercent(batterComposite.contact, 4);
  const pitchContactFactor = pitchData.contactFactor;

  const weights = [
    {
      value: true,
      weight: baseContactChance * pitchContactFactor * batterContactFactor,
    },
    {
      value: false,
      weight: 1 - baseContactChance,
    },
  ];

  const contact = randomByWeight<boolean>(random, weights);
  // pitchData.contactChance = {
  //   raw: baseContactChance,
  //   pitcherFactor: pitchContactFactor,
  //   batterFactor: batterContactFactor,
  //   batterRating: batterComposite.contact,
  //   activePerks: activePerks.map((p) => p.source.name),
  //   adjusted: weights[0].weight / sum(...weights.map((w) => w.weight)),
  // };
  return contact;
}
