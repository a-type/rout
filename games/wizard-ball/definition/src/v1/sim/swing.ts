import { GameRandom } from '@long-game/game-definition';
import type { Player, League, LeagueGameState } from '../gameTypes';
import { ActualPitch } from '../pitchData';
import { scaleAttributePercent } from '../utils';
import {
  getActivePlayerPerks,
  getModifiedCompositeBattingRatings,
} from './ratings';
import { randomByWeight } from './utils';

export function determineSwing(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  game: LeagueGameState,
  pitchData: ActualPitch,
): boolean {
  const baseSwingChance = isStrike ? 0.68 : 0.25;
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
  const count = 2 * game.strikes - game.balls;
  // const countWeight = 2 ** (batterComposite.plateDiscipline / 5) - 1;
  // const swingModifier = scaleAttributePercent(
  //   valueByWeights([
  //     { value: count, weight: countWeight },
  //     // TODO: Decide how to handle this (used to be agility)
  //     // Maybe simplify a bit?
  //     {
  //       value: isStrike
  //         ? batterComposite.plateDiscipline
  //         : 20 - batterComposite.plateDiscipline,
  //       weight: 3,
  //     },
  //   ]),
  //   2,
  // );
  // let swingChance = isStrike
  //   ? 0.68 ** (1 / swingModifier)
  //   : 0.25 ** (1 / swingModifier);
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
  let baseContactChance = isStrike ? 0.8 : 0.6;

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
